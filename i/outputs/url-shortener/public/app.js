const form = document.querySelector('#link-form');
const error = document.querySelector('#form-error');
const result = document.querySelector('#result');
const resultUrl = document.querySelector('#result-url');
const linksEl = document.querySelector('#links');
const emptyEl = document.querySelector('#empty');
let links = [];
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const formatDate = value => value ? new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)) : 'Not visited';
async function api(url, options) { const response = await fetch(url, options); const data = response.status === 204 ? null : await response.json(); if (!response.ok) throw new Error(data.error || 'Request failed'); return data; }
function render() {
  const total = links.reduce((sum, link) => sum + link.clicks, 0); const top = [...links].sort((a,b) => b.clicks-a.clicks)[0];
  document.querySelector('#total-links').textContent = links.length;
  document.querySelector('#total-clicks').textContent = total;
  document.querySelector('#top-link').textContent = top?.clicks ? `/${top.code}` : '—';
  emptyEl.classList.toggle('hidden', links.length > 0);
  linksEl.innerHTML = links.map(link => `<article class="link-row"><div><div class="link-name"><a href="${escapeHtml(link.shortUrl)}" target="_blank" rel="noreferrer">${escapeHtml(link.title || '/' + link.code)}</a></div><div class="destination">${escapeHtml(link.destination)}</div></div><div class="link-stats"><strong>${link.clicks} click${link.clicks === 1 ? '' : 's'}</strong><span>${formatDate(link.lastVisitedAt)}</span></div><div class="link-actions"><button class="icon-button" title="Copy link" data-copy="${escapeHtml(link.shortUrl)}">⧉</button><button class="icon-button delete" title="Delete link" data-delete="${link.id}">×</button></div></article>`).join('');
}
async function loadLinks() { try { links = await api('/api/links'); render(); } catch (err) { error.textContent = err.message; } }
async function copy(text, button) { await navigator.clipboard.writeText(text); const original = button.textContent; button.textContent = 'Copied'; setTimeout(() => button.textContent = original, 1200); }
form.addEventListener('submit', async event => { event.preventDefault(); error.textContent = ''; const submit = form.querySelector('[type=submit]'); submit.disabled = true; submit.querySelector('span').textContent = 'Creating…'; try { const link = await api('/api/links', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:document.querySelector('#url').value,code:document.querySelector('#code').value,title:document.querySelector('#title').value}) }); resultUrl.href = link.shortUrl; resultUrl.textContent = link.shortUrl; result.classList.remove('hidden'); form.reset(); await loadLinks(); } catch (err) { error.textContent = err.message; } finally { submit.disabled = false; submit.querySelector('span').textContent = 'Shorten link'; } });
document.querySelector('#copy-result').addEventListener('click', event => copy(resultUrl.href, event.currentTarget));
document.querySelector('#refresh').addEventListener('click', loadLinks);
linksEl.addEventListener('click', async event => { const copyUrl = event.target.dataset.copy; const deleteId = event.target.dataset.delete; if (copyUrl) return copy(copyUrl, event.target); if (deleteId && confirm('Delete this short link?')) { try { await api(`/api/links/${deleteId}`, {method:'DELETE'}); await loadLinks(); } catch (err) { error.textContent = err.message; } } });
loadLinks();
