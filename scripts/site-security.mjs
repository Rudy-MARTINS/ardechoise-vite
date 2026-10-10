// GitHub Pages serves static files without project-defined HTTP headers.
// Insert the policy before the page resources; dev-only allowances never enter a build.
export function siteSecurity() {
  let development = false

  return {
    name: 'site-security',
    configResolved(config) {
      development = config.command === 'serve'
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        const directives = [
          "default-src 'none'",
          "base-uri 'none'",
          "object-src 'none'",
          "form-action 'none'",
          `script-src 'self'${development ? " 'unsafe-inline'" : ''}`,
          `style-src 'self' https://fonts.googleapis.com${development ? " 'unsafe-inline'" : ''}`,
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self'",
          `connect-src 'self' https://api.github.com https://fonts.googleapis.com https://fonts.gstatic.com${development ? ' ws: wss:' : ''}`,
        ]
        return [{
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: directives.join('; ') },
          injectTo: 'head-prepend',
        }]
      },
    },
  }
}
