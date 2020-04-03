## Rematch async effect plugin for fetch reducers


##Setup
```javascript
import { init } from "@rematch/core";
import { createAsyncEffectPlugin } from '@aripjanov/rematch-plugins';

const asyncEffectPlugin = createAsyncEffectPlugin({
  normalizeKey: asyncEffectName => {
    return asyncEffectName.replace("fetch", "").toLowerCase();
  },
  normalizeError: error => {
    return error.message;
  }
});

init({
  plugins: [asyncEffectPlugin],
  models: [...]
})
```


##Fetch effect with plugin
```javascript
import {initialAsyncState} from "@aripjanov/rematch-plugins";

const UserModel = {
  state: {
    user: {
      isGuest: true
    },
    posts: initialAsyncState
  },
  reducers: {
    login(state, payload) {
      return update(state, {
        user: {
          isGuest: false,
          ...payload
        }
      });
    },
    logout(state) {
      return update(state, {
        user: {
          isGuest: true
        }
      });
    }
  },
  asyncEffects: {
    async fetchPosts(params) {
      const response = await api.posts(params);
      return response.data;
    }
  }
};

```


##Compare with Rematch effect

```javascript
const UserModel = {
  state: {
    posts: {
      isFetching: false,
      payload: null,
      error: null
    }
  },
  reducers: {
    performFetchPosts(state){
      return {...state, posts: {isFetching: true, payload: null, error: null}};
    },
    fulfillFetchPosts(state, payload){
      return {...state, posts: {isFetching: false, payload, error: null}};
    },
    rejectFetchPosts(state, error) {
      return {...state, posts: {isFetching: false, payload: null, error}};
    }
  },
  effects: {
    async fetchPosts(params) {
      this.performFetchPosts();
      try{
        const response = await api.posts(params);
        this.fulFillPosts(response.data);
      } catch(e) {
        this.rejectPosts(e);
      }
    }
  }
};

```

##Compare with clear redux
sorry I'm too lazy to write
