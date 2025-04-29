// Force cache refresh
window.addEventListener('load', function() {
  if (localStorage.getItem('cache_version') !== '1.0.1') {
    localStorage.setItem('cache_version', '1.0.1');
    localStorage.removeItem('queryClient');
    window.location.reload(true);
  }
}); 