import queryReducer from "../reducers/query";
import resultReducer from "../reducers/results";
// import { submitQuery, fetchCsv } from "./server";
import server from "./server";

import { SORT_MENU_MAX } from '../components/sort-menu/index';


class SolrClient {
	constructor(settings) {
		const { onChange } = settings;

		this.onChange = onChange;
		delete settings.onChange;

		this.state = {
			query: settings,
			results: {
				facets: [],
				docs: [],
				numFound: 0
			}
		};
		this.settings = {...settings};

		if (!this.state.query.pageStrategy) { this.state.query.pageStrategy = "paginate"; }
		if (!this.state.query.rows) { this.state.query.rows = 20; }

		if (this.state.query.pageStrategy === "cursor" && !this.state.query.idField) {
			throw new Error("Pagination strategy 'cursor' requires a unique 'idField' to be passed.");
		}
	}


	setInitialQuery(queryToMerge) {

		const searchFieldsToMerge = queryToMerge.searchFields || [];
		const sortFieldsToMerge = queryToMerge.sortFields || [];

		this.state.query.searchFields = this.state.query.searchFields
			.map((sf) => searchFieldsToMerge.map((sfm) => sfm.field).indexOf(sf.field) > -1
				? {...sf, value: searchFieldsToMerge.find((sfm) => sfm.field === sf.field).value}
				: sf);

		this.state.query.sortFields = this.state.query.sortFields
			.map((sf) => sortFieldsToMerge.map((sfm) => sfm.field).indexOf(sf.field) > -1
				? {...sf, value: sortFieldsToMerge.find((sfm) => sfm.field === sf.field).value}
				: sf);
	}

	initialize() {
		const { query } = this.state;
		const { pageStrategy } = query;
		const payload = {type: "SET_QUERY_FIELDS",
			...query, start: pageStrategy === "paginate" ? 0 : null
		};


		this.sendQuery(queryReducer(this.state.query, payload));

		return this;
	}

	resetSearchFields() {
		const { query } = this.state;
		const { pageStrategy } = query;
		const payload = {type: "SET_QUERY_FIELDS",
			...this.settings, pageStrategy: "paginate", rows: 20, start: pageStrategy === "paginate" ? 0 : null
		};
		this.sendQuery(queryReducer(this.state.query, payload));
	}

	sendQuery(query = this.state.query) {
		delete query.cursorMark;
		this.state.query = query;
		server.submitQuery(query, (action) => {
			this.state.results = resultReducer(this.state.results, action);
			this.state.query = queryReducer(this.state.query, action);
			this.onChange(this.state, this.getHandlers());
		});
	}

	sendNextCursorQuery() {
		server.submitQuery(this.state.query, (action) => {
			this.state.results = resultReducer(this.state.results, {
				...action,
				type: action.type === "SET_RESULTS" ? "SET_NEXT_RESULTS" : action.type
			});
			this.state.query = queryReducer(this.state.query, action);
			this.onChange(this.state, this.getHandlers());
		});
	}

	fetchCsv() {
		server.fetchCsv(this.state.query, (data) =>  {
			var element = document.createElement("a");
			element.setAttribute("href", "data:application/csv;charset=utf-8," + encodeURIComponent(data));
			element.setAttribute("download", "export.csv");

			element.style.display = "none";
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		});
	}

	setCurrentPage(page) {
		const { query } = this.state;
		const { rows } = query;
		const payload = {type: "SET_START", newStart: page * rows};

		this.sendQuery(queryReducer(this.state.query, payload));

	}

	setSearchFieldValue(field, value) {
		const { query } = this.state;
		const { searchFields } = query;
		const newFields = searchFields
			.map((searchField) => searchField.field === field ? {...searchField, value: value} : searchField);

		const payload = {type: "SET_SEARCH_FIELDS", newFields: newFields};

		this.sendQuery(queryReducer(this.state.query, payload));
	}

	setFacetSort(field, value) {
		const { query } = this.state;
		const { searchFields } = query;
		const newFields = searchFields
			.map((searchField) => searchField.field === field ? {...searchField, facetSort: value} : searchField);

		const payload = {type: "SET_SEARCH_FIELDS", newFields: newFields};

		this.sendQuery(queryReducer(this.state.query, payload));
	}

	setSortFieldValue(field, value, priority) {
		const { query } = this.state;
		const { sortFields } = query;

		var newSortFields = sortFields.map((sortField) =>
		{
				if (priority === SORT_MENU_MAX
					|| sortField.priority === undefined
				|| sortField.priority === SORT_MENU_MAX)
				{
					if (field === sortField.field)
					{
						return {...sortField, value: value, priority: priority};
					} else if (sortField.priority === undefined)
					{
						return {...sortField, value: null, priority: SORT_MENU_MAX}
					}
				}
				else if (priority === sortField.priority)
				{
					if (field === sortField.field)
					{
						return {...sortField, value: value, priority: priority};
					}
					else {
						return {...sortField, value: null, priority: SORT_MENU_MAX};
					}
				}
				return {...sortField}
		});

		newSortFields.sort(function(a, b) {
			return a.priority - b.priority;
		});

		var selected = newSortFields.length;
		for (var i = 0; i < newSortFields.length; i++)
		{
			if(newSortFields[i].priority === SORT_MENU_MAX)
			{
				selected = i;
				break;
			}
			else {
				newSortFields[i].priority = i + 1;
			}
		}

		if (selected == newSortFields.length)
		{
			for(var i = 0; i < newSortFields.length; i++)
			{
				newSortFields[i].priority--;
			}
		}

		const payload = {type: "SET_SORT_FIELDS", newSortFields: newSortFields};
		this.sendQuery(queryReducer(this.state.query, payload));
		return newSortFields;
	}

	setFilters(filters) {
		const payload = {type: "SET_FILTERS", newFilters: filters};
		this.sendQuery(queryReducer(this.state.query, payload));
	}

	setCollapse(field, value) {
		const { query } = this.state;
		const { searchFields } = query;
		const newFields = searchFields
			.map((searchField) => searchField.field === field ? {...searchField, collapse: value} : searchField);
		const payload = {type: "SET_SEARCH_FIELDS", newFields: newFields};
		this.state.query = queryReducer(this.state.query, payload);
		this.onChange(this.state, this.getHandlers());
	}

	getHandlers() {
		return {
			onSortFieldChange: this.setSortFieldValue.bind(this),
			onSearchFieldChange: this.setSearchFieldValue.bind(this),
			onFacetSortChange: this.setFacetSort.bind(this),
			onPageChange: this.setCurrentPage.bind(this),
			onNextCursorQuery: this.sendNextCursorQuery.bind(this),
			onSetCollapse: this.setCollapse.bind(this),
			onNewSearch: this.resetSearchFields.bind(this),
			onCsvExport: this.fetchCsv.bind(this)
		};
	}
}

export {
	SolrClient
};
