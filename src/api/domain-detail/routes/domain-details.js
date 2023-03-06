module.exports = {
  routes: [
    {
     method: 'GET',
     path: '/domain',
     handler: 'domain-details.getDomainDetails',
     config: {
       policies: [],
       middlewares: [],
     },
    },

  ],
};
