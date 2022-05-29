var TouchInput = pc.createScript("touchInput");
TouchInput.attributes.add("orbitSensitivity", { type: "number", default: .4, title: "Orbit Sensitivity", description: "How fast the camera moves around the orbit. Higher is faster" }), TouchInput.attributes.add("distanceSensitivity", { type: "number", default: .2, title: "Distance Sensitivity", description: "How fast the camera moves in and out. Higher is faster" }), TouchInput.prototype.initialize = function() { this.orbitCamera = this.entity.script.orbitCamera, this.lastTouchPoint = new pc.Vec2, this.lastPinchMidPoint = new pc.Vec2, this.lastPinchDistance = 0, this.orbitCamera && this.app.touch && (this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStartEndCancel, this), this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchStartEndCancel, this), this.app.touch.on(pc.EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this), this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this), this.on("destroy", (function() { this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStartEndCancel, this), this.app.touch.off(pc.EVENT_TOUCHEND, this.onTouchStartEndCancel, this), this.app.touch.off(pc.EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this), this.app.touch.off(pc.EVENT_TOUCHMOVE, this.onTouchMove, this) }))) }, TouchInput.prototype.getPinchDistance = function(t, i) {
  var o = t.x - i.x,
    n = t.y - i.y;
  return Math.sqrt(o * o + n * n)
}, TouchInput.prototype.calcMidPoint = function(t, i, o) { o.set(i.x - t.x, i.y - t.y), o.scale(.5), o.x += t.x, o.y += t.y }, TouchInput.prototype.onTouchStartEndCancel = function(t) {
  var i = t.touches;
  1 == i.length ? this.lastTouchPoint.set(i[0].x, i[0].y) : 2 == i.length && (this.lastPinchDistance = this.getPinchDistance(i[0], i[1]), this.calcMidPoint(i[0], i[1], this.lastPinchMidPoint))
}, TouchInput.fromWorldPoint = new pc.Vec3, TouchInput.toWorldPoint = new pc.Vec3, TouchInput.worldDiff = new pc.Vec3, TouchInput.prototype.pan = function(t) {
  var i = TouchInput.fromWorldPoint,
    o = TouchInput.toWorldPoint,
    n = TouchInput.worldDiff,
    h = this.entity.camera,
    c = this.orbitCamera.distance;
  h.screenToWorld(t.x, t.y, c, i), h.screenToWorld(this.lastPinchMidPoint.x, this.lastPinchMidPoint.y, c, o), n.sub2(o, i), this.orbitCamera.pivotPoint.add(n)
}, TouchInput.pinchMidPoint = new pc.Vec2, TouchInput.prototype.onTouchMove = function(t) {
  var i = TouchInput.pinchMidPoint,
    o = t.touches;
  if (1 == o.length) {
    var n = o[0];
    this.orbitCamera.pitch -= (n.y - this.lastTouchPoint.y) * this.orbitSensitivity, this.orbitCamera.yaw -= (n.x - this.lastTouchPoint.x) * this.orbitSensitivity, this.lastTouchPoint.set(n.x, n.y)
  } else if (2 == o.length) {
    var h = this.getPinchDistance(o[0], o[1]),
      c = h - this.lastPinchDistance;
    this.lastPinchDistance = h, this.orbitCamera.distance -= c * this.distanceSensitivity * .1 * (.1 * this.orbitCamera.distance), this.calcMidPoint(o[0], o[1], i), this.pan(i), this.lastPinchMidPoint.copy(i)
  }
};
var OrbitCamera = pc.createScript("orbitCamera");
OrbitCamera.attributes.add("autoRender", { type: "boolean", default: !0, title: "Auto Render", description: "Disable to only render when camera is moving (saves power when the camera is still)" }), OrbitCamera.attributes.add("distanceMax", { type: "number", default: 0, title: "Distance Max", description: "Setting this at 0 will give an infinite distance limit" }), OrbitCamera.attributes.add("distanceMin", { type: "number", default: 0, title: "Distance Min" }), OrbitCamera.attributes.add("pitchAngleMax", { type: "number", default: 90, title: "Pitch Angle Max (degrees)" }), OrbitCamera.attributes.add("pitchAngleMin", { type: "number", default: -90, title: "Pitch Angle Min (degrees)" }), OrbitCamera.attributes.add("inertiaFactor", { type: "number", default: 0, title: "Inertia Factor", description: "Higher value means that the camera will continue moving after the user has stopped dragging. 0 is fully responsive." }), OrbitCamera.attributes.add("focusEntity", { type: "entity", title: "Focus Entity", description: "Entity for the camera to focus on. If blank, then the camera will use the whole scene" }), OrbitCamera.attributes.add("frameOnStart", { type: "boolean", default: !0, title: "Frame on Start", description: 'Frames the entity or scene at the start of the application."' }), Object.defineProperty(OrbitCamera.prototype, "distance", { get: function() { return this._targetDistance }, set: function(t) { this._targetDistance = this._clampDistance(t) } }), Object.defineProperty(OrbitCamera.prototype, "pitch", { get: function() { return this._targetPitch }, set: function(t) { this._targetPitch = this._clampPitchAngle(t) } }), Object.defineProperty(OrbitCamera.prototype, "yaw", {
  get: function() { return this._targetYaw },
  set: function(t) {
    this._targetYaw = t;
    var i = (this._targetYaw - this._yaw) % 360;
    this._targetYaw = i > 180 ? this._yaw - (360 - i) : i < -180 ? this._yaw + (360 + i) : this._yaw + i
  }
}), Object.defineProperty(OrbitCamera.prototype, "pivotPoint", { get: function() { return this._pivotPoint }, set: function(t) { this._pivotPoint.copy(t) } }), OrbitCamera.prototype.focus = function(t) {
  this._buildAabb(t, 0);
  var i = this._modelsAabb.halfExtents,
    e = Math.max(i.x, Math.max(i.y, i.z));
  e /= Math.tan(.5 * this.entity.camera.fov * pc.math.DEG_TO_RAD), e *= 2, this.distance = e, this._removeInertia(), this._pivotPoint.copy(this._modelsAabb.center)
}, OrbitCamera.distanceBetween = new pc.Vec3, OrbitCamera.prototype.resetAndLookAtPoint = function(t, i) {
  this.pivotPoint.copy(i), this.entity.setPosition(t), this.entity.lookAt(i);
  var e = OrbitCamera.distanceBetween;
  e.sub2(i, t), this.distance = e.length(), this.pivotPoint.copy(i);
  var a = this.entity.getRotation();
  this.yaw = this._calcYaw(a), this.pitch = this._calcPitch(a, this.yaw), this._removeInertia(), this._updatePosition(), this.autoRender || (this.app.renderNextFrame = !0)
}, OrbitCamera.prototype.resetAndLookAtEntity = function(t, i) { this._buildAabb(i, 0), this.resetAndLookAtPoint(t, this._modelsAabb.center) }, OrbitCamera.prototype.reset = function(t, i, e) { this.pitch = i, this.yaw = t, this.distance = e, this._removeInertia(), this.autoRender || (this.app.renderNextFrame = !0) }, OrbitCamera.prototype.initialize = function() {
  this._checkAspectRatio(), this._modelsAabb = new pc.BoundingBox, this._buildAabb(this.focusEntity || this.app.root, 0), this.entity.lookAt(this._modelsAabb.center), this._pivotPoint = new pc.Vec3, this._pivotPoint.copy(this._modelsAabb.center), this._lastFramePivotPoint = this._pivotPoint.clone();
  var t = this.entity.getRotation();
  if (this._yaw = this._calcYaw(t), this._pitch = this._clampPitchAngle(this._calcPitch(t, this._yaw)), this.entity.setLocalEulerAngles(this._pitch, this._yaw, 0), this._distance = 0, this._targetYaw = this._yaw, this._targetPitch = this._pitch, this.frameOnStart) this.focus(this.focusEntity || this.app.root);
  else {
    var i = new pc.Vec3;
    i.sub2(this.entity.getPosition(), this._pivotPoint), this._distance = this._clampDistance(i.length())
  }
  this._targetDistance = this._distance, this._autoRenderDefault = this.app.autoRender, this.app.autoRender && (this.app.autoRender = this.autoRender), this.autoRender || (this.app.renderNextFrame = !0), this.on("attr:autoRender", (function(t, i) { this.app.autoRender = t, this.autoRender || (this.app.renderNextFrame = !0) }), this), this.on("attr:distanceMin", (function(t, i) { this._targetDistance = this._clampDistance(this._distance) }), this), this.on("attr:distanceMax", (function(t, i) { this._targetDistance = this._clampDistance(this._distance) }), this), this.on("attr:pitchAngleMin", (function(t, i) { this._targetPitch = this._clampPitchAngle(this._pitch) }), this), this.on("attr:pitchAngleMax", (function(t, i) { this._targetPitch = this._clampPitchAngle(this._pitch) }), this), this.on("attr:focusEntity", (function(t, i) { this.frameOnStart ? this.focus(t || this.app.root) : this.resetAndLookAtEntity(this.entity.getPosition(), t || this.app.root) }), this), this.on("attr:frameOnStart", (function(t, i) { t && this.focus(this.focusEntity || this.app.root) }), this);
  var onResizeCanvas = function() { this._checkAspectRatio(), this.autoRender || (this.app.renderNextFrame = !0) };
  this.app.graphicsDevice.on("resizecanvas", onResizeCanvas, this), this.on("destroy", (function() { this.app.graphicsDevice.off("resizecanvas", onResizeCanvas, this), this.app.autoRender = this._defaultAutoRender }), this)
}, OrbitCamera.prototype.update = function(t) {
  if (!this.autoRender) {
    var i = Math.abs(this._targetDistance - this._distance),
      e = Math.abs(this._targetYaw - this._yaw),
      a = Math.abs(this._targetPitch - this._pitch),
      s = this._lastFramePivotPoint.distance(this._pivotPoint);
    this.app.renderNextFrame = this.app.renderNextFrame || i > .01 || e > .01 || a > .01 || s > 0
  }
  var n = 0 === this.inertiaFactor ? 1 : Math.min(t / this.inertiaFactor, 1);
  this._distance = pc.math.lerp(this._distance, this._targetDistance, n), this._yaw = pc.math.lerp(this._yaw, this._targetYaw, n), this._pitch = pc.math.lerp(this._pitch, this._targetPitch, n), this._lastFramePivotPoint.copy(this._pivotPoint), this._updatePosition()
}, OrbitCamera.prototype._updatePosition = function() {
  this.entity.setLocalPosition(0, 0, 0), this.entity.setLocalEulerAngles(this._pitch, this._yaw, 0);
  var t = this.entity.getPosition();
  t.copy(this.entity.forward), t.scale(-this._distance), t.add(this.pivotPoint), this.entity.setPosition(t)
}, OrbitCamera.prototype._removeInertia = function() { this._yaw = this._targetYaw, this._pitch = this._targetPitch, this._distance = this._targetDistance }, OrbitCamera.prototype._checkAspectRatio = function() {
  var t = this.app.graphicsDevice.height,
    i = this.app.graphicsDevice.width;
  this.entity.camera.horizontalFov = t > i
}, OrbitCamera.prototype._buildAabb = function(t, i) {
  var e, a = 0,
    s = 0;
  if (t instanceof pc.Entity) {
    var n = [],
      r = t.findComponents("render");
    for (a = 0; a < r.length; ++a)
      if (e = r[a].meshInstances)
        for (s = 0; s < e.length; s++) n.push(e[s]);
    var h = t.findComponents("model");
    for (a = 0; a < h.length; ++a)
      if (e = h[a].meshInstances)
        for (s = 0; s < e.length; s++) n.push(e[s]);
    for (a = 0; a < n.length; a++) 0 === i ? this._modelsAabb.copy(n[a].aabb) : this._modelsAabb.add(n[a].aabb), i += 1
  }
  for (a = 0; a < t.children.length; ++a) i += this._buildAabb(t.children[a], i);
  return i
}, OrbitCamera.prototype._calcYaw = function(t) { var i = new pc.Vec3; return t.transformVector(pc.Vec3.FORWARD, i), Math.atan2(-i.x, -i.z) * pc.math.RAD_TO_DEG }, OrbitCamera.prototype._clampDistance = function(t) { return this.distanceMax > 0 ? pc.math.clamp(t, this.distanceMin, this.distanceMax) : Math.max(t, this.distanceMin) }, OrbitCamera.prototype._clampPitchAngle = function(t) { return pc.math.clamp(t, -this.pitchAngleMax, -this.pitchAngleMin) }, OrbitCamera.quatWithoutYaw = new pc.Quat, OrbitCamera.yawOffset = new pc.Quat, OrbitCamera.prototype._calcPitch = function(t, i) {
  var e = OrbitCamera.quatWithoutYaw,
    a = OrbitCamera.yawOffset;
  a.setFromEulerAngles(0, -i, 0), e.mul2(a, t);
  var s = new pc.Vec3;
  return e.transformVector(pc.Vec3.FORWARD, s), Math.atan2(s.y, -s.z) * pc.math.RAD_TO_DEG
};
var MouseInput = pc.createScript("mouseInput");
MouseInput.attributes.add("orbitSensitivity", { type: "number", default: .3, title: "Orbit Sensitivity", description: "How fast the camera moves around the orbit. Higher is faster" }), MouseInput.attributes.add("distanceSensitivity", { type: "number", default: .15, title: "Distance Sensitivity", description: "How fast the camera moves in and out. Higher is faster" }), MouseInput.prototype.initialize = function() {
  if (this.orbitCamera = this.entity.script.orbitCamera, this.orbitCamera) {
    var t = this,
      onMouseOut = function(o) { t.onMouseOut(o) };
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this), this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this), this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this), this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this), window.addEventListener("mouseout", onMouseOut, !1), this.on("destroy", (function() { this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this), this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this), this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this), this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this), window.removeEventListener("mouseout", onMouseOut, !1) }))
  }
  this.app.mouse.disableContextMenu(), this.lookButtonDown = !1, this.panButtonDown = !1, this.lastPoint = new pc.Vec2
}, MouseInput.fromWorldPoint = new pc.Vec3, MouseInput.toWorldPoint = new pc.Vec3, MouseInput.worldDiff = new pc.Vec3, MouseInput.prototype.pan = function(t) {
  var o = MouseInput.fromWorldPoint,
    e = MouseInput.toWorldPoint,
    i = MouseInput.worldDiff,
    s = this.entity.camera,
    n = this.orbitCamera.distance;
  s.screenToWorld(t.x, t.y, n, o), s.screenToWorld(this.lastPoint.x, this.lastPoint.y, n, e), i.sub2(e, o), this.orbitCamera.pivotPoint.add(i)
}, MouseInput.prototype.onMouseDown = function(t) {
  switch (t.button) {
    case pc.MOUSEBUTTON_LEFT:
      this.lookButtonDown = !0;
      break;
    case pc.MOUSEBUTTON_MIDDLE:
    case pc.MOUSEBUTTON_RIGHT:
      this.panButtonDown = !0
  }
}, MouseInput.prototype.onMouseUp = function(t) {
  switch (t.button) {
    case pc.MOUSEBUTTON_LEFT:
      this.lookButtonDown = !1;
      break;
    case pc.MOUSEBUTTON_MIDDLE:
    case pc.MOUSEBUTTON_RIGHT:
      this.panButtonDown = !1
  }
}, MouseInput.prototype.onMouseMove = function(t) {
  pc.app.mouse;
  this.lookButtonDown ? (this.orbitCamera.pitch -= t.dy * this.orbitSensitivity, this.orbitCamera.yaw -= t.dx * this.orbitSensitivity) : this.panButtonDown && this.pan(t), this.lastPoint.set(t.x, t.y)
}, MouseInput.prototype.onMouseWheel = function(t) { this.orbitCamera.distance -= t.wheel * this.distanceSensitivity * (.1 * this.orbitCamera.distance), t.event.preventDefault() }, MouseInput.prototype.onMouseOut = function(t) { this.lookButtonDown = !1, this.panButtonDown = !1 };
var KeyboardInput = pc.createScript("keyboardInput");
KeyboardInput.prototype.initialize = function() { this.orbitCamera = this.entity.script.orbitCamera }, KeyboardInput.prototype.postInitialize = function() { this.orbitCamera && (this.startDistance = this.orbitCamera.distance, this.startYaw = this.orbitCamera.yaw, this.startPitch = this.orbitCamera.pitch, this.startPivotPosition = this.orbitCamera.pivotPoint.clone()) }, KeyboardInput.prototype.update = function(t) { this.orbitCamera && this.app.keyboard.wasPressed(pc.KEY_SPACE) && (this.orbitCamera.reset(this.startYaw, this.startPitch, this.startDistance), this.orbitCamera.pivotPoint = this.startPivotPosition) };

//# sourceMappingURL=__game-scripts.js.map