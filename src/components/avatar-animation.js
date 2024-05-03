import { paths } from "../systems/userinput/paths";

export const ANIMATIONS = {
  IDLE: "Idle",
  WALKING: "Walking",
  WALKING_BACKWARD: "WalkingBackwards",
  WALKING_LEFT: "LeftStrafeWalk",
  WALKING_RIGHT: "RightStrafeWalk",
  RUNNING: "Running",
  RUNNING_BACKWARD: "RunningBackward",
  RUNNING_LEFT: "LeftStrafe",
  RUNNING_RIGHT: "RightStrafe",
  FLYING: "Fly"
};

// @ts-ignore
AFRAME.registerComponent("avatar-animation", {
  animations: null,

  clock: null,
  mixer: null,
  isMe: false,
  isMobile: false,

  schema: {
    front: { default: 0 },
    right: { default: 0 }
  },

  init() {
    this.animations = new Map();
    this.mixer = new THREE.AnimationMixer(this.el.object3D?.parent || this.el.object3D);
    this.clock = new THREE.Clock();
    this.userinput = AFRAME.scenes[0].systems.userinput;
    this.isMe = this.el.closest("#avatar-rig") != null;

    this.setAnimations(this.el.object3D);

    this.el.sceneEl.addEventListener("forward_animation", (front, right) => {
      console.log("forward_animation");
      if (this.isMe) {
        this.isMobile = true;
        this.el.setAttribute("avatar-animation", { front: 4, right: right });
        // this.walking();
      }
    });

    this.el.sceneEl.addEventListener("stop_animation", (front, right) => {
      console.log("stop_animation");
      if (this.isMe) {
        this.el.setAttribute("avatar-animation", { front: 0, right: right });
        // this.idle();
      }
    });
  },

  tick() {
    this.mixer.update(this.clock.getDelta());

    if (this.isMe && !this.isMobile && this.userinput.get(paths.actions.characterAcceleration)) {
      const [right, front] = this.userinput.get(paths.actions.characterAcceleration);
      this.el.setAttribute("avatar-animation", { front, right });
    }
  },

  update() {
    if (this.isIdle()) return this.idle();
    this.walking();
  },

  idle() {
    this.resetAll(ANIMATIONS.IDLE);
    this.setEffectiveWeight(ANIMATIONS.IDLE, 1);
  },

  resetAll(...ignore) {
    this.animations.forEach(animation => {
      if (ignore.includes(animation.getClip().name)) return;
      animation.setEffectiveWeight(0);
    });
  },

  isIdle() {
    return this.data.front === 0 && this.data.right === 0;
  },

  walking() {
    [
      [ANIMATIONS.WALKING, this.data.front],
      [ANIMATIONS.WALKING_BACKWARD, -this.data.front],
      [ANIMATIONS.WALKING_LEFT, -this.data.right],
      [ANIMATIONS.WALKING_RIGHT, this.data.right]
    ].forEach(([animationName, value]) => this.setEffectiveWeight(animationName, value));
  },

  setAnimations(object3D) {
    if (object3D.parent == null) return;
    if (object3D.animations.length === 0) return this.setAnimations(object3D.parent);

    object3D.animations.forEach(animation => {
      this.animations.set(animation.name, this.mixer.clipAction(animation));
      this.animations.get(animation.name).play();
      this.setEffectiveWeight(animation.name, 0);
    });
    this.setEffectiveWeight(ANIMATIONS.IDLE, 1);
  },

  setEffectiveWeight(animationName, weight) {
    this.animations.get(animationName)?.setEffectiveWeight(weight);
  }
});
