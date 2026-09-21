export function createSceneController(adapter) {
  let currentLifetime = null;

  function isActive(lifetime) {
    return currentLifetime === lifetime && lifetime.active;
  }

  function releaseAsset(lifetime, asset) {
    if (lifetime.leaseReleased) {
      return;
    }

    lifetime.leaseReleased = true;

    if (lifetime.assetAttached) {
      adapter.detachAsset(asset);
      lifetime.assetAttached = false;
    }

    lifetime.asset = null;

    if (asset.ownership === "owned") {
      adapter.disposeAsset(asset);
    }
  }

  function handleAsset(lifetime, asset) {
    if (!isActive(lifetime)) {
      releaseAsset(lifetime, asset);
      return;
    }

    lifetime.asset = asset;
    lifetime.assetAttached = true;
    adapter.attachAsset(asset);
  }

  function handleLoadFailure(lifetime, error) {
    if (!isActive(lifetime) || lifetime.errorReported) {
      return;
    }

    lifetime.errorReported = true;
    adapter.onError(error);
  }

  function beginLoad(lifetime) {
    let loadPromise;

    try {
      loadPromise = adapter.loadAsset();
    } catch (error) {
      handleLoadFailure(lifetime, error);
      return;
    }

    Promise.resolve(loadPromise).then(
      (asset) => handleAsset(lifetime, asset),
      (error) => handleLoadFailure(lifetime, error),
    );
  }

  function requestFrame(lifetime) {
    if (!isActive(lifetime) || lifetime.framePending) {
      return;
    }

    lifetime.framePending = true;
    lifetime.frameHandle = adapter.requestFrame((timestampMs) => {
      lifetime.framePending = false;
      lifetime.frameHandle = null;

      if (!isActive(lifetime)) {
        return;
      }

      const deltaSeconds = lifetime.hasTimestamp
        ? Math.min(
            0.1,
            Math.max(0, (timestampMs - lifetime.lastTimestampMs) / 1000),
          )
        : 0;

      lifetime.hasTimestamp = true;
      lifetime.lastTimestampMs = timestampMs;
      adapter.render(deltaSeconds);

      if (isActive(lifetime)) {
        requestFrame(lifetime);
      }
    });
  }

  function start() {
    if (currentLifetime?.active) {
      return;
    }

    const lifetime = {
      active: true,
      asset: null,
      assetAttached: false,
      errorReported: false,
      frameHandle: null,
      framePending: false,
      hasTimestamp: false,
      lastTimestampMs: 0,
      leaseReleased: false,
    };

    currentLifetime = lifetime;
    beginLoad(lifetime);
    requestFrame(lifetime);
  }

  function stop() {
    const lifetime = currentLifetime;

    if (!lifetime?.active) {
      return;
    }

    lifetime.active = false;
    currentLifetime = null;

    if (lifetime.framePending) {
      lifetime.framePending = false;
      const frameHandle = lifetime.frameHandle;
      lifetime.frameHandle = null;
      adapter.cancelFrame(frameHandle);
    }

    if (lifetime.asset !== null) {
      releaseAsset(lifetime, lifetime.asset);
    }
  }

  return { start, stop };
}
