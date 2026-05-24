function makeResponse(value) {
  return {
    json: async () => value,
  };
}

function makeKyInstance() {
  const instance = {
    create: () => instance,
  };

  const methods = ['get', 'post', 'put', 'delete', 'patch'];
  methods.forEach((m) => {
    instance[m] = (...args) => {
      const fn = instance["__" + m] || (instance["__" + m] = jest.fn(async () => makeResponse(undefined)));
      return fn(...args);
    };
  });

  return instance;
}

module.exports = makeKyInstance();
