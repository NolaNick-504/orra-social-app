// ORRA Chunk Error Recovery
// When a rebuild changes chunk hashes, browsers with stale HTML try to load
// old chunk filenames that return 404. This script detects those errors
// and force-reloads with a cache-bust parameter to get fresh HTML.
(function(){
  var retried = location.search.indexOf('_retry=') !== -1;
  if (retried) return;
  
  window.addEventListener('error', function(e) {
    var src = e.filename || (e.target && e.target.src) || '';
    if (src.indexOf('_next/static/chunks/') !== -1) {
      location.replace(location.pathname + '?_retry=' + Date.now());
    }
  });
  
  window.addEventListener('unhandledrejection', function(e) {
    var msg = String(e.reason || '');
    if (msg.indexOf('chunk') !== -1 || msg.indexOf('Failed to fetch') !== -1) {
      location.replace(location.pathname + '?_retry=' + Date.now());
    }
  });
})();
