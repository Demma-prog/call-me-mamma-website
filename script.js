/* ============================================
   CALL ME MAMMA — JavaScript
   Scroll Reveal, Smooth Scroll, Navbar, Mobile Menu
   ============================================ */

// Variabile globale per capire quando l'API YT è pronta
let ytApiReadyEventFired = false;
window.onYouTubeIframeAPIReady = function () {
  ytApiReadyEventFired = true;
  document.dispatchEvent(new Event('youtube-api-ready'));
};

// Caricamento asincrono API YouTube
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
if(firstScriptTag) {
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
} else {
  document.head.appendChild(tag);
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Elements ---
  const navbar = document.querySelector('.navbar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.navbar-links');
  const navOverlay = document.querySelector('.nav-overlay');
  const allNavLinks = document.querySelectorAll('.navbar-links a');
  const reveals = document.querySelectorAll('.reveal');

  // --- Navbar Scroll Effect ---
  let lastScroll = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // --- Mobile Menu ---
  function toggleMenu() {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    menuToggle.setAttribute('aria-expanded', String(navLinks.classList.contains('active')));
    menuToggle.setAttribute('aria-label', navLinks.classList.contains('active') ? 'Chiudi menu' : 'Apri menu');
  }

  function closeMenu() {
    menuToggle.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Apri menu');
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeMenu);
  }

  // Close menu on nav link click
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // --- Smooth Scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Scroll Reveal (Intersection Observer) ---
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optionally unobserve after revealing
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    }
  );

  reveals.forEach(el => {
    revealObserver.observe(el);
  });

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id]');

  function highlightNavLink() {
    const scrollY = window.scrollY + 150;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      const navLink = document.querySelector(`.navbar-links a[href="#${sectionId}"]`);

      if (navLink) {
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          navLink.style.color = 'var(--pink)';
          navLink.querySelector('::after')?.style && (navLink.style.setProperty('--link-active', '1'));
        } else {
          navLink.style.color = '';
        }
      }
    });
  }

  window.addEventListener('scroll', highlightNavLink, { passive: true });

  // --- Animate counters ---
  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(easeProgress * target);

      element.textContent = current.toLocaleString('it-IT');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Add + suffix for large numbers
        if (target >= 1000) {
          element.textContent = target.toLocaleString('it-IT') + '+';
        }
      }
    }

    requestAnimationFrame(update);
  }

  // YouTube stats are refreshed server-side; HTML values provide a resilient fallback.
  const statNumbers = document.querySelectorAll('.hero-stat-number[data-count]');
  statNumbers.forEach(el => animateCounter(el, parseInt(el.dataset.count, 10)));

  // --- Keyboard accessibility for menu ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      closeMenu();
    }
  });

  // --- Console Easter Egg ---
  console.log(
    '%c🎙️ Call Me Mamma — Powered by DEMMA',
    'color: #FF6B8A; font-size: 16px; font-weight: bold; font-family: sans-serif;'
  );
  // --- YouTube Dynamic Feed ---
  // The Vercel endpoint reads YouTube's official RSS feed server-side.
  const YOUTUBE_FEED_API = '/api/youtube-feed';
  const YOUTUBE_STATS_API = '/api/youtube-stats';
  
  const episodesGrid = document.getElementById('episodes-grid-container');

  async function fetchChannelStats() {
    try {
      const response = await fetch(YOUTUBE_STATS_API);
      if (!response.ok) throw new Error(`Statistiche non disponibili: ${response.status}`);
      const stats = await response.json();
      const values = {
        'stat-videos': stats.episodes,
        'stat-views': stats.views,
        'stat-subs': stats.subscribers
      };
      Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && Number.isFinite(value)) {
          element.dataset.count = String(value);
          animateCounter(element, value, 900);
        }
      });
    } catch (error) {
      console.warn('Uso delle statistiche di riserva:', error);
    }
  }

  async function fetchLatestVideos() {
    if (!episodesGrid) return;
    
    try {
      const response = await fetch(YOUTUBE_FEED_API);
      if (!response.ok) throw new Error(`Feed non disponibile: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data.items) && data.items.length > 0) {
        // Prendi gli ultimi 3 video
        const latestVideos = data.items.slice(0, 3);
        
        // Svuota il contenitore placeholder
        episodesGrid.innerHTML = '';

        latestVideos.forEach((video, index) => episodesGrid.appendChild(createEpisodeCard(video, index)));
      }
    } catch (error) {
      console.warn('Uso degli episodi di riserva:', error);
      // Se fallisce, lascia i placeholder originali
    }
  }

  function createEpisodeCard(video, index) {
    const link = document.createElement('a');
    link.href = video.link;
    link.className = `episode-card reveal ${index ? `reveal-delay-${index}` : ''} visible`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const thumbnail = document.createElement('div');
    thumbnail.className = 'episode-thumbnail';
    const image = document.createElement('img');
    image.src = video.thumbnail;
    image.alt = video.title;
    image.loading = 'lazy';
    thumbnail.appendChild(image);

    const play = document.createElement('div');
    play.className = 'episode-play-btn';
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    thumbnail.appendChild(play);
    const badge = document.createElement('span');
    badge.className = 'episode-number';
    badge.textContent = 'NUOVO';
    thumbnail.appendChild(badge);

    const info = document.createElement('div');
    info.className = 'episode-info';
    const title = document.createElement('h3');
    title.textContent = video.title;
    const description = document.createElement('p');
    description.textContent = "Guarda l'ultimo episodio caricato sul nostro canale YouTube!";
    const meta = document.createElement('div');
    meta.className = 'episode-meta';
    const date = document.createElement('span');
    date.className = 'episode-date';
    date.textContent = new Date(video.published).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    const watch = document.createElement('span');
    watch.className = 'episode-link';
    watch.textContent = 'Guarda ora →';
    meta.append(date, watch);
    info.append(title, description, meta);
    link.append(thumbnail, info);
    return link;
  }

  // Carica gli episodi dinamicamente; il markup HTML rimane come fallback.
  fetchLatestVideos();
  fetchChannelStats();

  // --- Audio Player (YouTube IFrame API) ---
  const playlistContainer = document.getElementById('player-playlist-items');
  const playerTrackTitle = document.getElementById('player-track-title');
  const playerTrackDate = document.getElementById('player-track-date');
  const playerPlayBtn = document.getElementById('player-play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const playerProgressBar = document.getElementById('player-progress-bar');
  const playerProgress = document.getElementById('player-progress');
  const playerCurrentTime = document.getElementById('player-current-time');
  const playerDuration = document.getElementById('player-duration');
  const playerRewindBtn = document.getElementById('player-rewind-btn');
  const playerForwardBtn = document.getElementById('player-forward-btn');

  let ytPlayer = null;
  let playerReady = false;
  let progressInterval = null;
  let playerPlaylist = [];
  let pendingVideoId = null;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Extract YouTube video ID from URL
  function extractVideoId(url) {
    if (!url) return null;
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];

    match = url.match(/youtube\.com\/shorts\/([^?]+)/);
    if (match) return match[1];

    return null;
  }

  // Populate playlist from RSS feed
  async function loadPlayerPlaylist() {
    if (!playlistContainer) return;
    try {
      const response = await fetch(YOUTUBE_FEED_API);
      if (!response.ok) throw new Error(`Feed non disponibile: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        playerPlaylist = data.items.map(item => ({
          title: item.title,
          videoId: item.videoId || extractVideoId(item.link),
          thumbnail: item.thumbnail,
          date: new Date(item.published).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
          link: item.link
        }));

        playlistContainer.innerHTML = '';
        playerPlaylist.forEach((track, i) => {
          const el = document.createElement('div');
          el.className = 'player-playlist-item';
          el.dataset.index = i;
          el.tabIndex = 0;
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', `Carica episodio: ${track.title}`);
          const info = document.createElement('div');
          info.className = 'player-playlist-item-info';
          const title = document.createElement('span');
          title.className = 'player-playlist-item-title';
          title.textContent = track.title;
          const date = document.createElement('span');
          date.className = 'player-playlist-item-date';
          date.textContent = track.date;
          info.append(title, date);
          el.appendChild(info);
          el.addEventListener('click', () => loadTrack(i));
          el.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              loadTrack(i);
            }
          });
          playlistContainer.appendChild(el);
        });
      }
    } catch (e) {
      console.log('Errore caricamento playlist audio:', e);
      if (playlistContainer) playlistContainer.innerHTML = '<div class="player-playlist-loading">Impossibile caricare la playlist</div>';
    }
  }

  function loadTrack(index) {
    const track = playerPlaylist[index];
    if (!track || !track.videoId) return;

    // Update UI
    playerTrackTitle.textContent = track.title;
    playerTrackDate.textContent = track.date;
    playerPlayBtn.disabled = false;
    playerRewindBtn.disabled = false;
    playerForwardBtn.disabled = false;
    
    // Update Cover Image
    const coverImage = document.getElementById('player-cover-image');
    if (coverImage) {
      coverImage.src = track.thumbnail;
    }

    // Highlight active item
    document.querySelectorAll('.player-playlist-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.player-playlist-item[data-index="${index}"]`);
    if (activeItem) activeItem.classList.add('active');

    // Carica il video (senza autoplay) e abilita il play
    if (ytPlayer && playerReady) {
      ytPlayer.cueVideoById(track.videoId);
      showPlay();
    } else {
      // Player non ancora pronto: accodo il video
      pendingVideoId = track.videoId;
    }
  }

  function showPlay() {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  }

  function showPause() {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  }

  // Play/Pause toggle — sempre gestito dal click umano (richiesto dai browser)
  if (playerPlayBtn) {
    playerPlayBtn.addEventListener('click', () => {
      if (!ytPlayer || !playerReady) return;
      const state = ytPlayer.getPlayerState();
      // -1 = non avviato, 5 = video in cue
      if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
        showPlay();
      } else {
        ytPlayer.playVideo();
        showPause();
      }
    });
  }

  playerRewindBtn?.addEventListener('click', () => {
    if (ytPlayer && playerReady) ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() - 15), true);
  });
  playerForwardBtn?.addEventListener('click', () => {
    if (ytPlayer && playerReady) ytPlayer.seekTo(Math.min(ytPlayer.getDuration(), ytPlayer.getCurrentTime() + 15), true);
  });

  // Progress bar click to seek
  if (playerProgress) {
    function seekToPercent(percent) {
      if (!ytPlayer || !playerReady) return;
      const safePercent = Math.max(0, Math.min(1, percent));
      ytPlayer.seekTo(safePercent * ytPlayer.getDuration(), true);
    }

    playerProgress.addEventListener('click', (e) => {
      if (!ytPlayer || !playerReady) return;
      const rect = playerProgress.getBoundingClientRect();
      seekToPercent((e.clientX - rect.left) / rect.width);
    });
    playerProgress.addEventListener('keydown', (e) => {
      if (!ytPlayer || !playerReady || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const duration = ytPlayer.getDuration() || 0;
      if (!duration) return;
      if (e.key === 'Home') seekToPercent(0);
      else if (e.key === 'End') seekToPercent(1);
      else seekToPercent((ytPlayer.getCurrentTime() + (e.key === 'ArrowRight' ? 10 : -10)) / duration);
    });
  }

  // Update progress bar
  function startProgressUpdater() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (!ytPlayer || !playerReady || typeof ytPlayer.getCurrentTime !== 'function') return;
      const current = ytPlayer.getCurrentTime() || 0;
      const duration = ytPlayer.getDuration() || 0;
      if (duration > 0) {
        const progress = (current / duration) * 100;
        playerProgressBar.style.width = progress + '%';
        playerProgress.setAttribute('aria-valuenow', String(Math.round(progress)));
        playerProgress.setAttribute('aria-valuetext', `${formatTime(current)} di ${formatTime(duration)}`);
        playerCurrentTime.textContent = formatTime(current);
        playerDuration.textContent = formatTime(duration);
      } else {
        // Fallback for UI if duration is not yet available
        playerCurrentTime.textContent = '0:00';
        playerDuration.textContent = '0:00';
      }
    }, 500);
  }

  // YouTube IFrame API Initialization
  function initYoutubePlayer() {
    if (ytPlayer) return; // Già inizializzato
    
    ytPlayer = new YT.Player('yt-player-iframe', {
      height: '200',
      width: '300',
      videoId: 'jNQXAC9IVRw', // "Me at the zoo", segnaposto inoffensivo
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          playerReady = true;
          startProgressUpdater();
          // Se l'utente aveva già selezionato un episodio, caricalo ora
          if (pendingVideoId) {
            ytPlayer.cueVideoById(pendingVideoId);
            showPlay();
            pendingVideoId = null;
          }
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            showPause();
          } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            showPlay();
          }
        }
      }
    });
  }

  if (ytApiReadyEventFired || (window.YT && window.YT.Player)) {
    initYoutubePlayer();
  } else {
    document.addEventListener('youtube-api-ready', initYoutubePlayer);
  }

  // --- Sticky Scroll Image Swap ---
  const storyBlocks = document.querySelectorAll('.story-block');
  const storyMainImage = document.getElementById('story-main-image');

  if (storyBlocks.length > 0 && storyMainImage) {
    const storyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const newImage = entry.target.dataset.image;
            if (newImage && storyMainImage.src.indexOf(newImage) === -1) {
              storyMainImage.style.opacity = 0;
              setTimeout(() => {
                storyMainImage.src = newImage;
                storyMainImage.style.opacity = 1;
              }, 400); // aspetta la transizione css
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    storyBlocks.forEach(block => storyObserver.observe(block));
  }

  loadPlayerPlaylist();

});
