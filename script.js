// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functionality
    initializeDropdowns();
    initializeSliders();
    
    // Navigation function
    function navigateToPage(pageName) {
        window.location.href = pageName;
    }
    
    // Make navigation function available globally
    window.navigateToPage = navigateToPage;
    
    // Dropdown functionality for Make button
    function initializeDropdowns() {
        const makeButton = document.getElementById('make-button');
        const makeDropdown = document.getElementById('make-dropdown');
        
        if (makeButton && makeDropdown) {
            // Build hover-enter/leave with animated slide
            const openMake = () => {
                makeDropdown.style.display = 'block';
                if (window.anime) {
                    anime.remove(makeDropdown);
                    makeDropdown.style.height = '0px';
                    makeDropdown.style.opacity = '0';
                    anime({ targets: makeDropdown, height: ['0px', makeDropdown.scrollHeight + 'px'], opacity: [0, 1], duration: 200, easing: 'easeOutQuad', complete: () => { makeDropdown.style.height = 'auto'; } });
                }
            };
            const closeMake = () => {
                if (window.anime) {
                    anime.remove(makeDropdown);
                    anime({ targets: makeDropdown, height: [makeDropdown.offsetHeight + 'px', '0px'], opacity: [1, 0], duration: 160, easing: 'easeInQuad', complete: () => { makeDropdown.style.display = 'none'; } });
                } else {
                    makeDropdown.style.display = 'none';
                }
            };
            let makeHoverTimer;
            makeButton.addEventListener('mouseenter', () => { clearTimeout(makeHoverTimer); openMake(); });
            makeButton.addEventListener('mouseleave', () => { makeHoverTimer = setTimeout(closeMake, 120); });
            makeDropdown.addEventListener('mouseenter', () => { clearTimeout(makeHoverTimer); });
            makeDropdown.addEventListener('mouseleave', () => { makeHoverTimer = setTimeout(closeMake, 120); });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!makeButton.contains(e.target) && !makeDropdown.contains(e.target)) {
                    makeDropdown.style.display = 'none';
                }
            });
            
            // Handle dropdown item clicks
            const dropdownItems = makeDropdown.querySelectorAll('.dropdown-item');
            dropdownItems.forEach(item => {
                item.addEventListener('click', function() {
                    const selectedMake = this.textContent;
                    makeButton.textContent = selectedMake;
                    makeDropdown.style.display = 'none';
                    console.log('Selected make:', selectedMake);
                });
            });
        }
    }
    
    // Dual range slider functionality
    function initializeSliders() {
        // Price range sliders
        const priceMinSlider = document.getElementById('price-min');
        const priceMaxSlider = document.getElementById('price-max');
        const priceMinValue = document.getElementById('price-min-value');
        const priceMaxValue = document.getElementById('price-max-value');
        
        if (priceMinSlider && priceMaxSlider && priceMinValue && priceMaxValue) {
            [priceMinSlider, priceMaxSlider].forEach(slider => {
                slider.addEventListener('input', function() {
                    const minVal = parseInt(priceMinSlider.value);
                    const maxVal = parseInt(priceMaxSlider.value);
                    
                    // Ensure min doesn't exceed max
                    if (minVal >= maxVal) {
                        if (this === priceMinSlider) {
                            priceMinSlider.value = maxVal - 1000;
                        } else {
                            priceMaxSlider.value = minVal + 1000;
                        }
                        return;
                    }
                    
                    priceMinValue.textContent = formatCurrency(parseInt(priceMinSlider.value));
                    priceMaxValue.textContent = formatCurrency(parseInt(priceMaxSlider.value));
                    console.log('Price range:', formatCurrency(parseInt(priceMinSlider.value)), 'to', formatCurrency(parseInt(priceMaxSlider.value)));
                });
            });
        }
        
        // Year range sliders
        const yearMinSlider = document.getElementById('year-min');
        const yearMaxSlider = document.getElementById('year-max');
        const yearMinValue = document.getElementById('year-min-value');
        const yearMaxValue = document.getElementById('year-max-value');
        
        if (yearMinSlider && yearMaxSlider && yearMinValue && yearMaxValue) {
            [yearMinSlider, yearMaxSlider].forEach(slider => {
                slider.addEventListener('input', function() {
                    const minVal = parseInt(yearMinSlider.value);
                    const maxVal = parseInt(yearMaxSlider.value);
                    
                    // Ensure min doesn't exceed max
                    if (minVal >= maxVal) {
                        if (this === yearMinSlider) {
                            yearMinSlider.value = maxVal - 1;
                        } else {
                            yearMaxSlider.value = minVal + 1;
                        }
                        return;
                    }
                    
                    yearMinValue.textContent = yearMinSlider.value;
                    yearMaxValue.textContent = yearMaxSlider.value;
                    console.log('Year range:', yearMinSlider.value, 'to', yearMaxSlider.value);
                });
            });
        }
        
        // Mileage range sliders
        const mileageMinSlider = document.getElementById('mileage-min');
        const mileageMaxSlider = document.getElementById('mileage-max');
        const mileageMinValue = document.getElementById('mileage-min-value');
        const mileageMaxValue = document.getElementById('mileage-max-value');
        
        if (mileageMinSlider && mileageMaxSlider && mileageMinValue && mileageMaxValue) {
            [mileageMinSlider, mileageMaxSlider].forEach(slider => {
                slider.addEventListener('input', function() {
                    const minVal = parseInt(mileageMinSlider.value);
                    const maxVal = parseInt(mileageMaxSlider.value);
                    
                    // Ensure min doesn't exceed max
                    if (minVal >= maxVal) {
                        if (this === mileageMinSlider) {
                            mileageMinSlider.value = maxVal - 1000;
                        } else {
                            mileageMaxSlider.value = minVal + 1000;
                        }
                        return;
                    }
                    
                    mileageMinValue.textContent = formatNumber(parseInt(mileageMinSlider.value));
                    mileageMaxValue.textContent = formatNumber(parseInt(mileageMaxSlider.value));
                    console.log('Mileage range:', formatNumber(parseInt(mileageMinSlider.value)), 'to', formatNumber(parseInt(mileageMaxSlider.value)));
                });
            });
        }
        
        // Hours range sliders
        const hoursMinSlider = document.getElementById('hours-min');
        const hoursMaxSlider = document.getElementById('hours-max');
        const hoursMinValue = document.getElementById('hours-min-value');
        const hoursMaxValue = document.getElementById('hours-max-value');
        
        if (hoursMinSlider && hoursMaxSlider && hoursMinValue && hoursMaxValue) {
            [hoursMinSlider, hoursMaxSlider].forEach(slider => {
                slider.addEventListener('input', function() {
                    const minVal = parseInt(hoursMinSlider.value);
                    const maxVal = parseInt(hoursMaxSlider.value);
                    
                    // Ensure min doesn't exceed max
                    if (minVal >= maxVal) {
                        if (this === hoursMinSlider) {
                            hoursMinSlider.value = maxVal - 100;
                        } else {
                            hoursMaxSlider.value = minVal + 100;
                        }
                        return;
                    }
                    
                    hoursMinValue.textContent = formatNumber(parseInt(hoursMinSlider.value));
                    hoursMaxValue.textContent = formatNumber(parseInt(hoursMaxSlider.value));
                    console.log('Hours range:', formatNumber(parseInt(hoursMinSlider.value)), 'to', formatNumber(parseInt(hoursMaxSlider.value)));
                });
            });
        }
    }
    
    // Utility function to format currency
    function formatCurrency(value) {
        return '$' + value.toLocaleString();
    }
    
    // Utility function to format numbers with commas
    function formatNumber(value) {
        return value.toLocaleString();
    }
    
    // Add click handlers for category buttons
    const categoryButtons = document.querySelectorAll('.category-button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Category selected:', this.textContent);
            // Navigate to listings page
            navigateToPage('listings.html');
        });
    });
    
    // Add click handlers for other filter buttons
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        if (button.id !== 'make-button') { // Skip make button as it has dropdown
            button.addEventListener('click', function() {
                console.log('Filter selected:', this.textContent);
                // Add your filter logic here
            });
        }
    });
    
    // Add click handlers for main navigation buttons
    const mainButtons = document.querySelectorAll('.buttons-container button');
    mainButtons.forEach((button) => {
        // Build custom dropdown from existing <select>
        const select = button.querySelector('select');
        if (select) {
            // Create container once
            let dd = button.querySelector('.button-dropdown');
            if (!dd) {
                dd = document.createElement('div');
                dd.className = 'button-dropdown';
                Array.from(select.options).forEach(opt => {
                    const div = document.createElement('div');
                    div.className = 'button-option';
                    div.textContent = opt.textContent;
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log('Menu selected:', div.textContent, 'from', button.childNodes[0].textContent.trim());
                        closeButtonDropdown(button, dd);
                    });
                    dd.appendChild(div);
                });
                button.appendChild(dd);
            }

            const openButtonDropdown = (btn, menu) => {
                menu.style.display = 'block';
                if (window.anime) {
                    anime.remove(menu);
                    menu.style.height = '0px';
                    menu.style.opacity = '0';
                    anime({ targets: menu, height: ['0px', menu.scrollHeight + 'px'], opacity: [0, 1], duration: 160, easing: 'easeOutQuad', complete: () => { menu.style.height = 'auto'; } });
                }
            };
            const closeButtonDropdown = (btn, menu) => {
                if (window.anime) {
                    anime.remove(menu);
                    anime({ targets: menu, height: [menu.offsetHeight + 'px', '0px'], opacity: [1, 0], duration: 140, easing: 'easeInQuad', complete: () => { menu.style.display = 'none'; } });
                } else {
                    menu.style.display = 'none';
                }
            };
            let hoverTimer;
            this.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openButtonDropdown(this, dd); });
            this.addEventListener('mouseleave', () => { hoverTimer = setTimeout(() => closeButtonDropdown(this, dd), 120); });
            dd.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); });
            dd.addEventListener('mouseleave', () => { hoverTimer = setTimeout(() => closeButtonDropdown(this, dd), 120); });
        }

        button.addEventListener('click', function() {
            // Get the text content, excluding the select element
            const buttonText = this.childNodes[0].textContent.trim();
            console.log('Main button clicked:', buttonText);
            
            // Handle different button clicks
            if (buttonText === 'HOME') {
                navigateToPage('index.html');
            } else if (buttonText === 'FINANCING' || buttonText === 'CONTACT US') {
                // These buttons don't navigate to listings page
                console.log('Special button clicked:', buttonText);
                // Add specific functionality for these buttons later
            } else {
                // All other buttons navigate to listings page
                navigateToPage('listings.html');
            }
        });
    });
    
    // Function to get current filter values (useful for future implementation)
    function getCurrentFilters() {
        return {
            make: document.getElementById('make-button').textContent,
            price: {
                min: parseInt(document.getElementById('price-min').value),
                max: parseInt(document.getElementById('price-max').value)
            },
            year: {
                min: parseInt(document.getElementById('year-min').value),
                max: parseInt(document.getElementById('year-max').value)
            },
            mileage: {
                min: parseInt(document.getElementById('mileage-min').value),
                max: parseInt(document.getElementById('mileage-max').value)
            },
            hours: {
                min: parseInt(document.getElementById('hours-min').value),
                max: parseInt(document.getElementById('hours-max').value)
            }
        };
    }
    
    // Make getCurrentFilters available globally for future use
    window.getCurrentFilters = getCurrentFilters;
    
    // Function to reset all filters
    function resetFilters() {
        // Reset make button
        const makeButton = document.getElementById('make-button');
        if (makeButton) {
            makeButton.textContent = 'Make';
        }
        
        // Reset range sliders to default values
        const rangeSliders = [
            { minId: 'price-min', maxId: 'price-max', minValue: 0, maxValue: 1000000 },
            { minId: 'year-min', maxId: 'year-max', minValue: 1970, maxValue: 2025 },
            { minId: 'mileage-min', maxId: 'mileage-max', minValue: 0, maxValue: 1000000 },
            { minId: 'hours-min', maxId: 'hours-max', minValue: 0, maxValue: 100000 }
        ];
        
        rangeSliders.forEach(range => {
            const minElement = document.getElementById(range.minId);
            const maxElement = document.getElementById(range.maxId);
            if (minElement && maxElement) {
                minElement.value = range.minValue;
                maxElement.value = range.maxValue;
                minElement.dispatchEvent(new Event('input')); // Trigger update
                maxElement.dispatchEvent(new Event('input')); // Trigger update
            }
        });
        
        console.log('Filters reset');
    }
    
    // Make resetFilters available globally
    window.resetFilters = resetFilters;
    
    console.log('Sidebar functionality initialized successfully');
    
    // Frontend integration: fetch & render live inventory on listings page
    const apiBase = (window.API_BASE || '').trim() || 'http://localhost:4000';
    const listingsGrid = document.querySelector('.listings-container');
    if (listingsGrid) {
        (async () => {
            try {
                const res = await fetch(`${apiBase}/api/inventory`);
                const items = await res.json();
                listingsGrid.innerHTML = '';
                items.forEach(item => {
                    const cover = (item.images && item.images.length > 0) ? item.images[0].publicUrl : '';
                    const card = document.createElement('div');
                    card.className = 'listing-item';
                    card.innerHTML = `
                        ${cover ? `<img src="${cover}" alt="cover" style="width:100%; height:180px; object-fit:cover; border-radius:6px; margin-bottom:10px;"/>` : ''}
                        <h3 class="listing-title">${item.year} ${item.make} ${item.model}</h3>
                        <div class="listing-details">
                            <div class="listing-category">${item.category}${item.subcategory ? ' • ' + item.subcategory : ''}</div>
                            ${item.mileage != null ? `<div class="listing-mileage">${Number(item.mileage).toLocaleString()} miles</div>` : ''}
                            ${item.hours != null ? `<div class="listing-hours">${Number(item.hours).toLocaleString()} hours</div>` : ''}
                        </div>`;
                    listingsGrid.appendChild(card);
                });
            } catch (e) {
                console.error('Failed to load inventory', e);
            }
        })();
    }

    // Page entrance animations using anime.js
    try {
        if (window.anime) {
            // Initial state (avoid flash)
            const sidebar = document.querySelector('aside');
            const banner = document.querySelector('.banner-container');
            const buttons = document.querySelector('.buttons-container');
            const search = document.querySelector('.search-container');
            const categories = document.querySelector('.categories-container');
            const listings = document.querySelector('.listings-container');

            if (sidebar) sidebar.style.opacity = '0';
            if (banner) banner.style.opacity = '0';
            if (buttons) buttons.style.opacity = '0';
            if (search) search.style.opacity = '0';
            if (categories) categories.style.opacity = '0';
            if (listings) listings.style.opacity = '0';

            const tl = anime.timeline({ autoplay: true });

            // 1) Sidebar N -> S (from top)
            if (sidebar) {
                tl.add({
                    targets: sidebar,
                    translateY: [-30, 0],
                    opacity: [0, 1],
                    duration: 350,
                    easing: 'easeOutQuad'
                });
            }

            // 2) Banner, then Buttons, then Search — E -> W (from right)
            if (banner) {
                tl.add({
                    targets: banner,
                    translateX: [40, 0],
                    opacity: [0, 1],
                    duration: 250,
                    easing: 'easeOutQuad'
                });
            }
            if (buttons) {
                tl.add({
                    targets: buttons,
                    translateX: [40, 0],
                    opacity: [0, 1],
                    duration: 220,
                    easing: 'easeOutQuad'
                });
            }
            if (search) {
                tl.add({
                    targets: search,
                    translateX: [40, 0],
                    opacity: [0, 1],
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            }

            // 3) Categories or Listings — S -> N (from bottom)
            const finalGrid = categories || listings;
            if (finalGrid) {
                tl.add({
                    targets: finalGrid,
                    translateY: [24, 0],
                    opacity: [0, 1],
                    duration: 280,
                    easing: 'easeOutQuad'
                });
            }
        }
    } catch (e) {
        console.warn('Animation init failed', e);
    }
});
