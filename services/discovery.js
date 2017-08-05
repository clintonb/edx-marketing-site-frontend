const cache = require('memory-cache');
const rp = require('request-promise-native');


class DiscoveryService {
  constructor(apiGatewayUrl, oauthClientId, oauthClientSecret, discoveryApiUrl) {
    this.ACCESS_TOKEN_CACHE_KEY = 'discovery-service-access-token';
    this.accessToken = null;

    this.apiGatewayUrl = apiGatewayUrl;
    if (!this.apiGatewayUrl.endsWith('/')) {
      this.apiGatewayUrl += '/'
    }

    // TODO Replace with API gateway
    this.discoveryApiUrl = discoveryApiUrl;
    if (!this.discoveryApiUrl.endsWith('/')) {
      this.discoveryApiUrl += '/'
    }

    this.oauthClientId = oauthClientId;
    this.oauthClientSecret = oauthClientSecret;
  }

  buildApiUrl(path) {
    return `${this.discoveryApiUrl}${path}`;
  }

  /**
   * Ensures this object has a valid, unexpired, access token.
   * @returns {Promise.<Object>}
   */
  ensureAccessToken() {
    console.log('Retrieving access token...');
    this.accessToken = cache.get(this.ACCESS_TOKEN_CACHE_KEY);

    if (this.accessToken) {
      return new Promise((resolve, reject) => {
        console.log('Retrieved access token from cache.');
        resolve(this.accessToken);
      });
    }
    else {
      const options = {
        method: 'POST',
        uri: `${this.apiGatewayUrl}oauth2/v1/access_token`,
        form: {
          grant_type: 'client_credentials',
          client_id: this.oauthClientId,
          client_secret: this.oauthClientSecret,
          token_type: 'jwt'
        },
        transform: JSON.parse
      };

      console.log('Retrieving access token from OAuth provider...');

      return rp(options)
        .then((res) => {
          console.log('Retrieved access token from OAuth provider.');
          this.accessToken = res.access_token;
          cache.put(this.ACCESS_TOKEN_CACHE_KEY, this.accessToken, res.expires_in);
        })
        .catch((err) => {
          console.error('Failed to retrieve access token from OAuth provider!');
          console.error(err)
        });
    }
  }


  /**
   * Retrieves the program linked to the specified marketing slug (URL path).
   * @param {string} programType
   * @param {string} marketingSlug - Marketing slug (URL path) for the program to retrieve.
   */
  getProgram(programType, marketingSlug) {
    if (programType.startsWith('professional')) {
      programType = 'professional+certificate';
    }

    console.log(`Retrieving ${programType} program with marketing slug ${marketingSlug} from Discovery Service...`);

    return this.ensureAccessToken().then(() => {
      const options = {
        uri: this.buildApiUrl(`programs/?type=${programType}&marketing_slug=${marketingSlug}`),
        headers: {
          'Authorization': `JWT ${this.accessToken}`
        },
        json: true
      };

      return rp(options).then((res) => {
        // The endpoint returns a list of results (even though there is only one). Get the first item.
        options.uri = this.buildApiUrl(`programs/${res.results[0].uuid}/`);

        // FIXME get the correct program with one call
        // Call the API again to get the complete details
        return rp(options);
      });
    });
  }

  /**
   * Retrieves the person linked to the specified slug (URL path).
   * @param {string} slug
   */
  getPerson(slug) {
    console.log(`Retrieving person with slug ${slug} from Discovery Service...`);
    return this.ensureAccessToken().then(() => {
      const options = {
        uri: this.buildApiUrl(`people/?slug=${slug}`),
        headers: {
          'Authorization': `JWT ${this.accessToken}`
        },
        json: true
      };

      return rp(options).then((res) => {
        const person = res.results[0];

        // Retrieve the course runs associated with this person
        options.uri = this.buildApiUrl(`search/course_runs/facets/?staff_uuids=${person.uuid}`);

        // FIXME get the correct program with one call
        // Call the API again to get the complete details
        return rp(options).then((res) => {
          person.course_runs = res.objects.results;
          return person;
        });
      });
    });

  }
}

module.exports = DiscoveryService;
