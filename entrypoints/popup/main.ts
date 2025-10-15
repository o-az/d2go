const app = document.querySelector('div#app')
if (!app) throw new Error('App root element not found')

app.innerHTML = /* html */ `
  <div style="padding: 20px; font-family: system-ui; min-width: 300px;">
    <h2>DevTool2Go</h2>
    <p>✨ Eruda DevTools is active on all pages</p>
    <p>Look for the floating Eruda icon on any webpage</p>
  </div>
`
