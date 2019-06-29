import Combobox from './Combobox.js';

export default class SearchCombo extends Combobox {
	/**
	 * SearchCombo
	 * @param {Object} comboboxNode - DOM node that contains input and list
	 * @description This is simple search implementation. It also could be used as inplace search.
	 */
	constructor(comboboxNode) {
		super(comboboxNode);
		this.suggestionsOvelay = document.querySelector('[data-js-suggestions-overlay]');
		this.endpoint = this.listbox.getAttribute('data-url');
		this.setupXHR();
	}

	setupXHR() {
		const onError = () => this.toggleSpinner(false);

		this.request = new XMLHttpRequest();
		this.request.addEventListener('error', onError);
		this.request.addEventListener('abort', onError);
		this.request.addEventListener('timeout', onError);
	}

	processResponse(query, response) {
		try {
			// If all falls SF respond with JSON instead of HTML string
			JSON.parse(response);
			this.toggleSpinner(false);
			this.closeListbox();
		} catch (error) {
			if (document.activeElement !== this.input || this.input.value !== query) {
				this.toggleSpinner(false);
				this.closeListbox();
				return;
			}

			this.listbox.innerHTML = response;

			this.activeIndex = -1;
			this.input.setAttribute('aria-activedescendant', '');

			const totalSuggests = this.listbox
				.querySelector('#search-result-count')
				.getAttribute('data-total');

			this.toggleSpinner(false);
			this.afterSuggestionsUpdate(query, parseInt(totalSuggests, 10));
		}
	}

	getSuggestions(query) {
		this.request.abort();
		this.request.open('GET', this.endpoint); // + encodeURIComponent(query)
		this.request.onreadystatechange = (response) => {
			if (response.target.readyState === 4) {
				if (response.target.status === 200) {
					this.processResponse(query, response.target.responseText);
				} else {
					this.toggleSpinner(false);
					this.closeListbox();
				}
			}
		};
		this.request.send();

		this.toggleSpinner(true);
	}

	selectItem(item) {
		// We do not need default combobox behaviour.
		// Instead of pasting suggestion value we go by the link
		if (item) {
			const clickEvent = new MouseEvent('click', {
				view: window,
				bubbles: false,
				cancelable: true,
			});
			item.dispatchEvent(clickEvent);
		}
	}

	handleClick() {
		// We do not need handle click since we have links inside
	}

	handleFocus() {
		this.updateListbox();
	}

	handleBlur() {
		if (this.hasHoverWithin || this.activeIndex > 0) {
			return;
		}
		this.closeListbox();
		const clearInput = () => {
			this.input.value = '';
		};
		setTimeout(clearInput, 150); // In case if user decide to submit form with search button
	}

	toggleOverlay(isShown) {
		const overlayStyles = this.suggestionsOvelay.style;
		this.flyoutMinHeight = this.suggestionsOvelay.offsetParent
			? this.suggestionsOvelay.offsetParent.clientHeight : this.flyoutMinHeight;

		if (!isShown) {
			overlayStyles.opacity = 0;
			overlayStyles.visibility = 'hidden';
			overlayStyles.height = `${this.flyoutMinHeight}px`;

			this.toggleGlobalOverlay(false);
		} else {
			const flyoutBorderHeight = 4;
			const suggestionsHeight = this.listbox.firstElementChild
				? this.listbox.firstElementChild.clientHeight : 30;

			overlayStyles.opacity = 1;
			overlayStyles.visibility = 'visible';
			overlayStyles.height = `${suggestionsHeight + flyoutBorderHeight + this.flyoutMinHeight}px`;

			this.toggleGlobalOverlay(true);
		}
	}

	toggleGlobalOverlay(isOpen) {
		//const closeSearch = () => this.closeListbox();
		//if (isOpen) {
		//	window.globalOverlay.open('m-partial', closeSearch);
		//} else {
		//	window.globalOverlay.close();
		//}
	}

	toggleSpinner(isShown) {
		const content = this.listbox.firstElementChild;

		if (isShown) {
			if (content) {
				content.setAttribute('aria-busy', 'true');
			}
			this.toggleOverlay(true);
		} else {
			if (content) {
				content.setAttribute('aria-busy', 'false');
			}
			this.toggleOverlay(false);
		}
	}

	afterItemActivated(item) {
		const suggestions = this.listbox.querySelector('[data-js-combo-listbox-content]');
		if (typeof suggestions.scrollTo === 'function') {
			suggestions.scrollTo({
				top: item.offsetTop,
				left: 0,
				behavior: 'smooth',
			});
		}
	}
};
