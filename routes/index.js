const DiscoveryService = require('../services/discovery');
const express = require('express');
const router = express.Router();

router.get('/:programType(micromasters|professional-certificate|xseries)/:marketingSlug([\\w-]+)',
  function(req, res, next) {
    // TODO Catch not found errors, and render the 404 page.
    const locals = req.app.locals;
    const discoveryService = new DiscoveryService(
      locals.API_GATEWAY_URL,
      locals.OAUTH_CLIENT_ID,
      locals.OAUTH_CLIENT_SECRET,
      locals.DISCOVERY_API_URL
    );
    discoveryService.getProgram(req.params.programType, req.params.marketingSlug)
      .then((programData) => {
        res.render('program-detail', {title: programData.title, program: programData});
      })
      .catch((err) => {
        // TODO Raise error
        console.error(err);
        res.status(500).send('Something broke!');
      });
  }
);

router.get('/bio/:slug([\\w-]+)',
  function(req, res, next) {
    // TODO Catch not found errors, and render the 404 page.
    const locals = req.app.locals;

    // TODO Instantiate this once across the service rather than for each route
    const discoveryService = new DiscoveryService(
      locals.API_GATEWAY_URL,
      locals.OAUTH_CLIENT_ID,
      locals.OAUTH_CLIENT_SECRET,
      locals.DISCOVERY_API_URL
    );
    discoveryService.getPerson(req.params.slug)
      .then((person) => {
        // Preload the profile and course run images to avoid blocking rendering later.
        const preloaded_images = [person.profile_image_url].concat(person.course_runs.map((course_run) => {
          return course_run.image_url;
        }));
        person.name = `${person.given_name} ${person.family_name}`;
        res.render('person-detail', {title: person.name, person: person, preloaded_images: preloaded_images});
      })
      .catch((err) => {
        // TODO Raise error
        console.error(err);
        res.status(500).send('Something broke!');
      });
  }
);

module.exports = router;
