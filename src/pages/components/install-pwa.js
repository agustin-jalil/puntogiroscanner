let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').style.display = 'block';
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('installBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`El usuario eligió: ${outcome}`);
      deferredPrompt = null;
      btn.style.display = 'none';
    }
  });
});
