import Combobox from './Combobox.js';

export default class AddressCombobox extends Combobox {
	/**
	 * AddressCombobox
	 * @param {Object} comboboxNode - DOM node that contains input and list
	 * @description This is simple search implementation. It also could be used as inplace search.
	 */
	constructor(comboboxNode) {
		super(comboboxNode);
		this.minChars = 1;
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
};
