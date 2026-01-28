let observer: MutationObserver | null = null;

export async function initPlaylistPage() {
    const section = document.querySelector('main [role=presentation]');
    if (!section) {
        return;
    }

    const searchBox = section.querySelector('.main-actionBar-ActionBarRow > div:last-child');
    const topbarContent = document.querySelector('.main-topBar-topbarContent');
    if (!searchBox || !topbarContent) {
        return;
    }

    console.log('WMPotify: Initializing playlist page');

    searchBox.id = "playlist-search-box-container";
    const searchBoxOrigParent = searchBox.parentElement;

    if (observer) {
        observer.disconnect();
    }
    observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const targetElement = mutation.target as HTMLElement | null;
                if (targetElement && targetElement.classList.contains('main-entityHeader-topbarContentFadeIn')) {
                    targetElement.appendChild(searchBox);
                } else {
                    searchBoxOrigParent?.appendChild(searchBox);
                }
            }
        }
    });
    observer.observe(topbarContent, { attributes: true, attributeFilter: ['class'] });

    const listHeader = section.querySelector('.main-trackList-trackListHeaderRow');
    if (listHeader) {
        for (const button of listHeader.querySelectorAll(':scope > div')) {
            if (button.querySelector('button')) {
                button.classList.add('has-button');

                if (button.querySelector('svg:has(path[d="m14 6-6 6-6-6h12z"])') || button.querySelector('svg:has(path[d="M14 10 8 4l-6 6h12z"])')) {
                    button.classList.add('selected');
                }
    
                const observer = new MutationObserver(() => {
                    observer.disconnect();
                    if (button.querySelector('svg:has(path[d="m14 6-6 6-6-6h12z"])') || button.querySelector('svg:has(path[d="M14 10 8 4l-6 6h12z"])')) {
                        button.classList.add('selected');
                    } else {
                        button.classList.remove('selected');
                    }
                    observer.observe(button, { childList: true, subtree: true });
                });
                observer.observe(button, { childList: true, subtree: true });
            }
        }
    }
}