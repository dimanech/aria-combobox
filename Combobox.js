export default class Combobox {
	/*
	 * Combobox
	 *
	 * Please see specification:
	 * https://www.w3.org/TR/wai-aria-practices/#combobox
	 *
	 * This software or document includes material copied from or derived from
	 * https://www.w3.org/TR/wai-aria-practices/examples/combobox/aria1.1pattern/listbox-combo.html.
	 * Copyright ©2019 W3C® (MIT, ERCIM, Keio, Beihang).
	 * All Rights Reserved. This work is distributed under the
	 * W3C® Software License http://www.w3.org/Consortium/Legal/copyright-software
	 * in the hope that it will be useful, but WITHOUT ANY WARRANTY;
	 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
	 * PARTICULAR PURPOSE.
	 */
	constructor(comboboxNode) {
		this.combobox = comboboxNode;
		this.input = this.combobox.querySelector('input[aria-autocomplete]');
		this.listbox = document.getElementById(this.input.getAttribute('aria-controls'));

		this.minChars = 3;
		this.focusedItemClassName = 'm-focused';
		this.suggetionsUpdateDelay = 400;

		this.lastSearchedTerm = '';
		this.activeIndex = -1;
		this.resultsCount = 0;
		this.isListboxOpen = false;

		this.keyCode = Object.freeze({
			TAB: 9,
			RETURN: 13,
			ESC: 27,
			SPACE: 32,
			END: 35,
			HOME: 36,
			LEFT: 37,
			UP: 38,
			RIGHT: 39,
			DOWN: 40,
			BACKSPACE: 8,
		});
	}

	init() {
		this.initEventListeners();
	}

	initEventListeners() {
		this.handleOuterClick = this.handleOuterClick.bind(this);
		this.handleKeydown = this.handleKeydown.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleInput = this.handleInput.bind(this);
		this.handleMouseenter = this.handleMouseenter.bind(this);
		this.handleMouseleave = this.handleMouseleave.bind(this);

		document.body.addEventListener('click', this.handleOuterClick);
		this.input.addEventListener('keydown', this.handleKeydown);
		this.input.addEventListener('focus', this.handleFocus);
		this.input.addEventListener('blur', this.handleBlur);
		this.input.addEventListener('input', this.handleInput);
		this.listbox.addEventListener('click', this.handleClick);
		this.listbox.addEventListener('mouseenter', this.handleMouseenter);
		this.listbox.addEventListener('mouseleave', this.handleMouseleave);
	}

	handleInput() {
		if (this.input.value.length >= this.minChars) {
			this.updateListbox();
		} else {
			clearTimeout(this.timeout);
			this.closeListbox();
		}
	}

	handleClick(evt) {
		if (evt.target && evt.target.nodeName === 'DIV') {
			this.selectItem(evt.target);
		}
	}

	handleMouseenter() {
		this.hasHoverWithin = true;
	}

	handleMouseleave() {
		this.hasHoverWithin = false;
	}

	handleFocus() {
		this.updateListbox();
	}

	handleBlur() {
		if (this.hasHoverWithin || this.activeIndex < 0) {
			return;
		}
		this.selectItem(this.getItemByIndex(this.activeIndex));
	}

	handleOuterClick(event) {
		if (!this.isListboxOpen || this.combobox.contains(event.target)) {
			return;
		}
		this.closeListbox();
	}

	handleKeydown(event) {
		let preventEventActions = false;

		switch (event.keyCode) {
			case this.keyCode.ESC:
				this.closeListbox();
				this.input.value = '';
				preventEventActions = true;
				break;
			case this.keyCode.UP:
				this.setActiveToNextItem();
				this.activateItem();
				preventEventActions = true;
				break;
			case this.keyCode.DOWN:
				this.setActiveToPreviousItem();
				this.activateItem();
				preventEventActions = true;
				break;
			case this.keyCode.RETURN:
				this.selectItem(this.getItemByIndex(this.activeIndex));
				return;
			case this.keyCode.TAB:
				this.closeListbox();
				return;
			default:
				return;
		}

		if (preventEventActions) {
			event.stopPropagation();
			event.preventDefault();
		}
	}

	setActiveToPreviousItem() {
		if (this.activeIndex === -1 || this.activeIndex >= this.resultsCount - 1) {
			this.activeIndex = 0;
		} else {
			this.activeIndex++;
		}
	}

	setActiveToNextItem() {
		if (this.activeIndex <= 0) {
			this.activeIndex = this.resultsCount - 1;
		} else {
			this.activeIndex--;
		}
	}

	activateItem() {
		this.activeItem = this.getItemByIndex(this.activeIndex);

		if (this.prevActive) {
			this.prevActive.classList.remove(this.focusedItemClassName);
			this.prevActive.setAttribute('aria-selected', 'false');
		}

		if (this.activeItem) {
			this.input.setAttribute('aria-activedescendant', `result-item-${this.activeIndex}`);
			this.activeItem.classList.add(this.focusedItemClassName);
			this.activeItem.setAttribute('aria-selected', 'true');
			this.afterItemActivated(this.activeItem);
		} else {
			this.input.setAttribute('aria-activedescendant', '');
		}

		this.prevActive = this.activeItem;
	}

	afterItemActivated(item) {
		this.input.value = item.innerText;
	}

	getItemByIndex(index) {
		return document.getElementById(`result-item-${index}`);
	}

	selectItem(item) {
		if (item) {
			this.input.value = item.innerText;
			this.closeListbox();
		}
	}

	updateListbox() {
		if ((this.lastSearchedTerm === this.input.value)
			|| (this.input.value.length < this.minChars)) {
			return;
		}

		clearTimeout(this.timeout);
		const query = this.input.value; // we should cache query to prevent query different value after timeout
		this.timeout = setTimeout(this.getSuggestions.bind(this, query), this.suggetionsUpdateDelay);
	}

	getSuggestions(query) {
		// This is example of getSuggestion method to implement
		const results = ['Result example'];
		this.closeListbox();

		if (results.length) {
			this.listbox.innerHTML = `<li role="option" id="result-item-${0}">${results[0]}</li>
                                      <li role="status" aria-live="polite">1 suggestion found</li>`;

			this.afterSuggestionsUpdate(query, results.length);
		}
	}

	afterSuggestionsUpdate(query, resultsCount) {
		this.resultsCount = resultsCount;
		this.activeIndex = -1;
		this.lastSearchedTerm = query;
		this.openListbox();
	}

	openListbox() {
		this.isListboxOpen = true;

		this.listbox.classList.add('m-active');
		this.combobox.setAttribute('aria-expanded', 'true');
		this.toggleOverlay(true);
	}

	closeListbox() {
		this.isListboxOpen = false;
		this.resultsCount = 0;
		this.activeIndex = -1;
		this.lastSearchedTerm = '';

		this.listbox.classList.remove('m-active');
		this.listbox.innerHTML = '';
		this.input.setAttribute('aria-activedescendant', '');
		this.combobox.setAttribute('aria-expanded', 'false');
		this.toggleOverlay(false);
	}

	toggleOverlay(isShown) {
		this.isOverlayVisible = isShown;
	}

	destroy() {
		document.body.removeEventListener('click', this.handleOuterClick);
		this.input.removeEventListener('keydown', this.handleKeydown);
		this.input.removeEventListener('focus', this.handleFocus);
		this.input.removeEventListener('blur', this.handleBlur);
		this.input.removeEventListener('input', this.handleInput);
		this.listbox.removeEventListener('click', this.handleClick);
		this.listbox.removeEventListener('mouseenter', this.handleMouseenter);
		this.listbox.removeEventListener('mouseleave', this.handleMouseleave);
	}
}
