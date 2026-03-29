/** @type {import('gsap-slides').Config} */
export default {
  // Theme: "dark" | "light" | custom object
  theme: "dark",

  // Default transition between slides
  transition: "slideLeft",

  // Slide dimensions
  width: 1920,
  height: 1080,

  // GSAP defaults applied to all animations
  gsap: {
    duration: 0.8,
    ease: "power2.inOut",
  },

  // Dev server options
  server: {
    port: 3000,
    open: true,
  },
};
