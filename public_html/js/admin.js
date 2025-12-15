document.addEventListener('DOMContentLoaded', () => {
    const apiBase = (window.ADMIN_API_BASE || '').trim() || 'http://localhost:4000';
    let adminToken = localStorage.getItem('ADMIN_TOKEN') || '';
    const form = document.getElementById('item-form');
    const itemSelect = document.getElementById('item-select');
    const imagesInput = document.getElementById('images');
    const uploadBtn = document.getElementById('upload-images');
    const formStatus = document.getElementById('form-status');
    const uploadStatus = document.getElementById('upload-status');
    const adminInventory = document.getElementById('admin-inventory');

    async function fetchInventory() {
        const res = await fetch(`${apiBase}/api/inventory`);
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
                    ${cover ? `<img src="${cover}" alt="cover" style="width:100%; height:150px; object-fit:cover; border-radius:6px;"/>` : ''}
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
        formStatus.textContent = 'Saving...';
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
        try {
            const idField = document.getElementById('item-id').value.trim();
            const isUpdate = !!idField;
            const url = isUpdate ? `${apiBase}/api/admin/inventory/${idField}` : `${apiBase}/api/admin/inventory`;
            const method = isUpdate ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save');
            }
            formStatus.textContent = 'Saved!';
            (form.reset && form.reset());
            document.getElementById('item-id').value = '';
            await reload();
        } catch (err) {
            formStatus.textContent = `Error: ${err.message}`;
        }
    });

    uploadBtn.addEventListener('click', async () => {
        uploadStatus.textContent = 'Uploading...';
        const itemId = itemSelect.value;
        if (!itemId) { uploadStatus.textContent = 'Select an item first'; return; }
        const files = imagesInput.files;
        if (!files || files.length === 0) { uploadStatus.textContent = 'Choose images'; return; }
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('images', f));
        try {
            const res = await fetch(`${apiBase}/api/admin/inventory/${itemId}/images`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` }, body: formData });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to upload');
            }
            uploadStatus.textContent = 'Uploaded!';
            imagesInput.value = '';
            await reload();
        } catch (err) {
            uploadStatus.textContent = `Error: ${err.message}`;
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
    resetBtn.addEventListener('click', () => { form.reset(); document.getElementById('item-id').value=''; formStatus.textContent=''; });
    deleteBtn.addEventListener('click', async () => {
        const idField = document.getElementById('item-id').value.trim();
        if (!idField) { formStatus.textContent = 'No item selected to delete'; return; }
        if (!confirm('Delete this item?')) return;
        formStatus.textContent = 'Deleting...';
        try {
            const res = await fetch(`${apiBase}/api/admin/inventory/${idField}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete'); }
            form.reset(); document.getElementById('item-id').value='';
            formStatus.textContent = 'Deleted';
            await reload();
        } catch (err) {
            formStatus.textContent = `Error: ${err.message}`;
        }
    });

    // Populate form when selecting item in dropdown
    itemSelect.addEventListener('change', async () => {
        const id = itemSelect.value;
        if (!id) return;
        const res = await fetch(`${apiBase}/api/inventory/${id}`);
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
                await fetch(`${apiBase}/api/admin/inventory/${itemId}/images/${imageId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
                await reload();
            });
        });
    }

    async function sendNewOrder() {
        const itemId = itemSelect.value;
        const ids = Array.from(gallery.children).map(c => c.dataset.id);
        await fetch(`${apiBase}/api/admin/inventory/${itemId}/images/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ order: ids })
        });
    }

    reload();
});


