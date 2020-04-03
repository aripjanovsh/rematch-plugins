const createPerformReducer = key => state => ({
  ...state,
  [key]: { isFetching: true, payload: null, errors: null }
});
const createFulfilledReducer = key => (state, payload) => ({
  ...state,
  [key]: { isFetching: false, payload, errors: null }
});

const createRejectReducer = key => (state, payload) => ({
  ...state,
  [key]: { isFetching: false, payload: null, errors: payload }
});

const defaultState = {
  isFetching: false,
  payload: null,
  errors: null
};

export const initialAsyncState = defaultState;

export const createAsyncEffectPlugin = pluginConfig => ({
  exposed: {
    asyncEffects: {}
  },
  onModel(model) {
    if (!model.asyncEffects) {
      return;
    }

    const asyncEffects =
      typeof model.asyncEffects === "function"
        ? model.asyncEffects(this.dispatch)
        : model.asyncEffects;

    let cntModelReducers = this.config.models[model.name].reducers;
    if(!cntModelReducers) cntModelReducers = {};

    for (const asyncEffectName of Object.keys(asyncEffects)) {
      this.validate([
        [
          !!asyncEffectName.match(/\//),
          `Invalid effect name (${model.name}/${asyncEffectName})`
        ],
        [
          typeof asyncEffects[asyncEffectName] !== "function",
          `Invalid effect (${model.name}/${asyncEffectName}). Must be a function`
        ]
      ]);

      const keyName = pluginConfig.normalizeKey
        ? pluginConfig.normalizeKey(asyncEffectName)
        : asyncEffectName;

      const fetchCallName = `${asyncEffectName}`;
      const fetchPerformName = `${asyncEffectName}Perform`;
      const fetchFulfillName = `${asyncEffectName}Fulfill`;
      const fetchRejectName = `${asyncEffectName}Reject`;

      cntModelReducers[fetchPerformName] = createPerformReducer(keyName);
      cntModelReducers[fetchFulfillName] = createFulfilledReducer(keyName);
      cntModelReducers[fetchRejectName] = createRejectReducer(keyName);

      [
        fetchPerformName,
        fetchFulfillName,
        fetchRejectName,
        fetchCallName
      ].forEach(name => {
        this.dispatch[model.name][name] = this.createDispatcher.apply(this, [
          model.name,
          name
        ]);
      });

      this.asyncEffects[`${model.name}/${fetchCallName}`] = asyncEffects[
        asyncEffectName
        ].bind(this.dispatch[model.name]);
      this.dispatch[model.name][asyncEffectName].isEffect = true;
    }
  },
  middleware(store) {
    return next => async action => {
      const { type, payload: actionPayload } = action;
      if (type in this.asyncEffects) {
        const asyncEffect = this.asyncEffects[type];
        store.dispatch({ type: `${type}Perform` });
        try {
          const payload = await asyncEffect(actionPayload, store);
          store.dispatch({ type: `${type}Fulfill`, payload });
        } catch (error) {
          const payload = pluginConfig.normalizeError
            ? pluginConfig.normalizeError(error)
            : error;
          store.dispatch({ type: `${type}Reject`, payload });
        }
        return;
      }

      return next(action);
    };
  }
});
