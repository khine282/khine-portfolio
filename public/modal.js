// modal.js - Image Modal Handler
// Usage: Add onclick="openModal(this.src, this.alt)" to any <img> tag

function openModal(imageSrc, imageAlt) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('imageModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      z-index: 9999;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.95);
      align-items: center;
      justify-content: center;
    `;
    
    modal.innerHTML = `
      <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;">
        <span style="position: absolute; top: 20px; right: 40px; color: white; font-size: 40px; font-weight: bold; cursor: pointer; z-index: 10000; user-select: none;" onclick="closeImageModal();">&times;</span>
        <img id="modalImage" src="" alt="" style="max-width: 100%; max-height: 100%; border-radius: 8px; object-fit: contain;">
        <p id="modalCaption" style="color: white; text-align: center; margin-top: 16px; font-family: var(--font-mono); font-size: 12px;"></p>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  document.getElementById('modalImage').src = imageSrc;
  document.getElementById('modalImage').alt = imageAlt;
  document.getElementById('modalCaption').textContent = imageAlt;
  modal.style.display = 'flex';
  
  // Close on background click
  modal.onclick = function(event) {
    if (event.target === modal) {
      closeImageModal();
    }
  }
  
  // Close on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeImageModal();
    }
  });
}

function closeImageModal() {
  let modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
  }
}