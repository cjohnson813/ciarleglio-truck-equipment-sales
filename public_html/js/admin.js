document.addEventListener('DOMContentLoaded', () => {
    const apiBase = (typeof window !== 'undefined' && window.API_BASE ? String(window.API_BASE).trim() : '') || 'http://localhost:4000';
    let adminToken = localStorage.getItem('ADMIN_TOKEN') || '';
    const form = document.getElementById('item-form');
    const itemSelect = document.getElementById('item-select');
    const imagesInput = document.getElementById('images');
    const uploadBtn = document.getElementById('upload-images');
    const formStatus = document.getElementById('form-status');
    const formLoading = document.getElementById('form-loading');
    const formValidationMsg = document.getElementById('form-validation-msg');
    const uploadStatus = document.getElementById('upload-status');
    const adminInventory = document.getElementById('admin-inventory');
    const saveBtn = document.getElementById('save-item');

    function authHeaders() {
        const h = { 'Content-Type': 'application/json' };
        if (adminToken) h['Authorization'] = 'Bearer ' + adminToken;
        return h;
    }

    function setFormLoading(loading) {
        if (formLoading) formLoading.style.display = loading ? 'inline' : 'none';
        if (saveBtn) saveBtn.disabled = loading;
    }

    function showValidation(msg) {
        if (formValidationMsg) {
            formValidationMsg.textContent = msg || '';
            formValidationMsg.style.display = msg ? 'block' : 'none';
        }
    }

    async function fetchInventory() {
        const res = await fetch(`${apiBase}/api/inventory`, { credentials: 'include' });
        const data = await res.json();
        return data;
    }

    function renderInventory(items) {
        // Populate item dropdown
        itemSelect.innerHTML = '';
        items.forEach(it => {
            const opt = document.createElement('option');
            opt.value = it.id;
            opt.textContent = `${it.year} ${it.make} ${it.model}`;
            itemSelect.appendChild(opt);
        });

        // Render cards
        adminInventory.innerHTML = '';
        items.forEach(item => {
            const cover = (item.images && item.images.length > 0) ? item.images[0].publicUrl : '';
            const div = document.createElement('div');
            div.className = 'listing-item';
            div.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${cover ? `<img src="${cover}" alt="${item.year} ${item.make} ${item.model}" style="width:100%; height:150px; object-fit:cover; border-radius:6px;"/>` : '<div class="listing-item-image-placeholder" style="height:150px;">No Image</div>'}
                    <h3 class="listing-title">${item.year} ${item.make} ${item.model}</h3>
                    <div class="listing-details">
                        <div class="listing-category">${item.category}${item.subcategory ? ' • ' + item.subcategory : ''}</div>
                        ${item.mileage != null ? `<div class="listing-mileage">${item.mileage.toLocaleString()} miles</div>` : ''}
                        ${item.hours != null ? `<div class="listing-hours">${item.hours.toLocaleString()} hours</div>` : ''}
                        <div class="listing-category">Condition: ${item.condition}</div>
                    </div>
                </div>
            `;
            adminInventory.appendChild(div);
        });
    }

    async function reload() {
        const items = await fetchInventory();
        renderInventory(items);
        const selectedId = itemSelect.value;
        renderGallery(items.find(i => i.id === selectedId));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showValidation('');
        formStatus.textContent = '';
        const payload = {
            category: document.getElementById('category').value.trim(),
            subcategory: document.getElementById('subcategory').value.trim() || undefined,
            make: document.getElementById('make').value.trim(),
            model: document.getElementById('model').value.trim(),
            mileage: document.getElementById('mileage').value ? Number(document.getElementById('mileage').value) : undefined,
            hours: document.getElementById('hours').value ? Number(document.getElementById('hours').value) : undefined,
            year: Number(document.getElementById('year').value),
            condition: document.getElementById('condition').value
        };
        if (!payload.mileage && payload.hours === undefined) {
            showValidation('Either mileage (trucks) or hours (equipment) is required.');
            return;
        }
        setFormLoading(true);
        formStatus.textContent = 'Saving...';
        try {
            const idField = document.getElementById('item-id').value.trim();
            const isUpdate = !!idField;
            const url = isUpdate ? `${apiBase}/api/admin/inventory/${idField}` : `${apiBase}/api/admin/inventory`;
            const method = isUpdate ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: authHeaders(),
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const errBody = await res.json().catch(() => ({}));
            if (!res.ok) {
                showValidation(errBody.error || 'Failed to save');
                formStatus.textContent = '';
                return;
            }
            formStatus.textContent = 'Saved!';
            (form.reset && form.reset());
            document.getElementById('item-id').value = '';
            await reload();
        } catch (err) {
            showValidation(err.message || 'Failed to save');
            formStatus.textContent = '';
        } finally {
            setFormLoading(false);
        }
    });

    const MIN_IMAGE_WIDTH = 400;
    const MIN_IMAGE_HEIGHT = 300;
    function checkImageDimensions(files) {
        return new Promise((resolve) => {
            const allowed = [];
            const tooSmall = [];
            let pending = 0;
            function done() {
                if (--pending === 0) resolve({ allowed, tooSmall });
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type || !file.type.startsWith('image/')) { allowed.push(file); continue; }
                pending++;
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = function () {
                    URL.revokeObjectURL(url);
                    if (img.naturalWidth >= MIN_IMAGE_WIDTH && img.naturalHeight >= MIN_IMAGE_HEIGHT) allowed.push(file);
                    else tooSmall.push({ name: file.name, w: img.naturalWidth, h: img.naturalHeight });
                    done();
                };
                img.onerror = function () { URL.revokeObjectURL(url); allowed.push(file); done(); };
                img.src = url;
            }
            if (pending === 0) resolve({ allowed, tooSmall });
        });
    }

    uploadBtn.addEventListener('click', async () => {
        const itemId = itemSelect.value;
        if (!itemId) { uploadStatus.textContent = 'Select an item first'; return; }
        const files = imagesInput.files;
        if (!files || files.length === 0) { uploadStatus.textContent = 'Choose images'; return; }
        const fileList = Array.from(files);
        const { allowed, tooSmall } = await checkImageDimensions(fileList);
        if (tooSmall.length > 0) {
            const msg = tooSmall.map(s => s.name + ' (' + s.w + '×' + s.h + ')').join(', ');
            if (!confirm('Some images are below recommended size (min ' + MIN_IMAGE_WIDTH + '×' + MIN_IMAGE_HEIGHT + ' px): ' + msg + '. Upload anyway?')) return;
        }
        const toUpload = allowed.length ? allowed : fileList;
        uploadStatus.textContent = 'Uploading...';
        const formData = new FormData();
        toUpload.forEach(f => formData.append('images', f));
        const headers = {};
        if (adminToken) headers['Authorization'] = 'Bearer ' + adminToken;
        try {
            const res = await fetch(`${apiBase}/api/admin/inventory/${itemId}/images`, { method: 'POST', headers, body: formData, credentials: 'include' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to upload');
            }
            uploadStatus.textContent = 'Uploaded!';
            imagesInput.value = '';
            await reload();
        } catch (err) {
            uploadStatus.textContent = 'Error: ' + err.message;
        }
    });

    // Admin token handling
    const setTokenBtn = document.getElementById('admin-set-token');
    const authStatus = document.getElementById('admin-auth-status');
    function updateAuthStatus() { authStatus.textContent = adminToken ? 'Admin token set' : 'No admin token set'; }
    setTokenBtn.addEventListener('click', () => {
        const t = prompt('Enter admin token:');
        if (t != null) {
            adminToken = t.trim();
            localStorage.setItem('ADMIN_TOKEN', adminToken);
            updateAuthStatus();
        }
    });
    updateAuthStatus();

    // Edit/Delete item helpers
    const resetBtn = document.getElementById('reset-form');
    const deleteBtn = document.getElementById('delete-item');
    resetBtn.addEventListener('click', () => { form.reset(); document.getElementById('item-id').value = ''; formStatus.textContent = ''; showValidation(''); });

    const deleteModal = document.getElementById('admin-delete-modal');
    const deleteCancelBtn = document.getElementById('admin-delete-cancel');
    const deleteConfirmBtn = document.getElementById('admin-delete-confirm');
    deleteBtn.addEventListener('click', () => {
        const idField = document.getElementById('item-id').value.trim();
        if (!idField) { formStatus.textContent = 'Select an item to delete first'; return; }
        if (deleteModal) {
            deleteModal.classList.add('is-open');
            deleteModal.setAttribute('aria-hidden', 'false');
            deleteConfirmBtn.dataset.deleteId = idField;
        }
    });
    function closeDeleteModal() {
        if (deleteModal) {
            deleteModal.classList.remove('is-open');
            deleteModal.setAttribute('aria-hidden', 'true');
            if (deleteConfirmBtn) deleteConfirmBtn.dataset.deleteId = '';
        }
    }
    if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal && deleteModal.querySelector('.admin-modal-backdrop')) {
        deleteModal.querySelector('.admin-modal-backdrop').addEventListener('click', closeDeleteModal);
    }
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', async () => {
            const idField = deleteConfirmBtn.dataset.deleteId;
            if (!idField) return;
            closeDeleteModal();
            formStatus.textContent = 'Deleting...';
            try {
                const res = await fetch(`${apiBase}/api/admin/inventory/${idField}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
                if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete'); }
                form.reset(); document.getElementById('item-id').value = '';
                formStatus.textContent = 'Deleted';
                await reload();
            } catch (err) {
                formStatus.textContent = 'Error: ' + err.message;
            }
        });
    }

    // Populate form when selecting item in dropdown
    itemSelect.addEventListener('change', async () => {
        const id = itemSelect.value;
        if (!id) return;
        setFormLoading(true);
        showValidation('');
        try {
            const res = await fetch(`${apiBase}/api/inventory/${id}`, { credentials: 'include' });
            const item = await res.json();
        document.getElementById('item-id').value = item.id;
        document.getElementById('category').value = item.category || '';
        document.getElementById('subcategory').value = item.subcategory || '';
        document.getElementById('make').value = item.make || '';
        document.getElementById('model').value = item.model || '';
        document.getElementById('mileage').value = item.mileage ?? '';
        document.getElementById('hours').value = item.hours ?? '';
        document.getElementById('year').value = item.year || '';
        document.getElementById('condition').value = item.condition || 'GOOD';
        renderGallery(item);
        } finally {
            setFormLoading(false);
        }
    });

    // Image gallery with drag-and-drop
    const gallery = document.getElementById('image-gallery');
    function renderGallery(item) {
        if (!gallery) return;
        gallery.innerHTML = '';
        if (!item || !item.images) return;
        item.images.forEach(img => {
            const w = document.createElement('div');
            w.style.width = '140px';
            w.style.display = 'flex';
            w.style.flexDirection = 'column';
            w.style.gap = '6px';
            w.draggable = true;
            w.dataset.id = img.id;
            w.innerHTML = `
                <img src="${img.publicUrl}" alt="img" style="width:140px; height:100px; object-fit:cover; border-radius:6px;"/>
                <button data-del="${img.id}" style="background:#a72a2a;">Delete</button>
            `;
            gallery.appendChild(w);
        });

        // Drag and drop reorder
        let dragEl = null;
        gallery.querySelectorAll('[draggable=true]').forEach(el => {
            el.addEventListener('dragstart', () => { dragEl = el; });
            el.addEventListener('dragover', (e) => { e.preventDefault(); });
            el.addEventListener('drop', async (e) => {
                e.preventDefault();
                if (!dragEl || dragEl === el) return;
                const children = Array.from(gallery.children);
                const dragIdx = children.indexOf(dragEl);
                const dropIdx = children.indexOf(el);
                if (dragIdx < dropIdx) {
                    gallery.insertBefore(dragEl, el.nextSibling);
                } else {
                    gallery.insertBefore(dragEl, el);
                }
                await sendNewOrder();
            });
        });

        gallery.querySelectorAll('button[data-del]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = itemSelect.value;
                const imageId = btn.getAttribute('data-del');
                if (!confirm('Delete this image?')) return;
                await fetch(`${apiBase}/api/admin/inventory/${itemId}/images/${imageId}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
                await reload();
            });
        });
    }

    async function sendNewOrder() {
        const itemId = itemSelect.value;
        const ids = Array.from(gallery.children).map(c => c.dataset.id);
        await fetch(`${apiBase}/api/admin/inventory/${itemId}/images/reorder`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ order: ids }),
            credentials: 'include'
        });
    }

    reload();
});


