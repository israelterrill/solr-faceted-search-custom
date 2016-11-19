import React from "react";
import cx from "classnames";
import SearchIcon from "./icons/search";
import {SORT_MENU_MAX} from "./sort-menu/index"
import componentPack from "./component-pack";

const getFacetValues = (type, results, field, lowerBound, upperBound) =>
	type === "period-range-facet" ? (results.facets[lowerBound] || []).concat(results.facets[upperBound] || []) :
		type === "list-facet" || type === "range-facet" ? results.facets[field] || [] : null;


class SolrFacetedSearch extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
				sortBaseComponents: [0]
			};

			this.checkOnChange = this.checkOnChange.bind(this);
	}

	checkOnChange(field, value, priority)
	{
		var newFields = this.props.onSortFieldChange(field, value, priority);
		var selected = 0;
		for (var i = 0; i < newFields.length; i++)
		{
			if (newFields[i].priority < SORT_MENU_MAX)
			{
				selected++;
			}
		}

		this.addSortComponent(field, selected, newFields);
	}

	addSortComponent(field, selected, newFields)
	{
		if (this.state.sortBaseComponents.length < selected + 1
			&& this.state.sortBaseComponents.length < this.props.query.sortFields.length
		)
		{
				var newArray = this.state.sortBaseComponents;
				newArray.push(this.state.sortBaseComponents[this.state.sortBaseComponents.length - 1] + 1);
				this.setState({
					sortBaseComponents: newArray
				});
		}
		else if (this.state.sortBaseComponents.length > (selected + 1 ))
		{
				var newArray = this.state.sortBaseComponents;
				newArray.pop();
				this.setState({sortBaseComponents: newArray});
		}
		this.render();
	}

	valueIsValid(sortField)
	{
		return sortField.value !== undefined && sortField.value !== null;
	}


	render() {
		const { customComponents, bootstrapCss, query, results, truncateFacetListsAt } = this.props;
		const { onSearchFieldChange, onSortFieldChange, onPageChange, onCsvExport } = this.props;

		const { searchFields, sortFields, start, rows } = query;


		const SearchFieldContainerComponent = customComponents.searchFields.container;
		const ResultContainerComponent = customComponents.results.container;

		const ResultComponent = customComponents.results.result;
		const ResultCount = customComponents.results.resultCount;
		const ResultHeaderComponent = customComponents.results.header;
		const ResultListComponent = customComponents.results.list;
		const ResultPendingComponent = customComponents.results.pending;
		const PaginateComponent = customComponents.results.paginate;
		const PreloadComponent = customComponents.results.preloadIndicator;
		const CsvExportComponent = customComponents.results.csvExport;
		const CurrentQueryComponent = customComponents.searchFields.currentQuery;
		const SortComponent = customComponents.sortFields.menu;
		const resultPending = results.pending ? (<ResultPendingComponent bootstrapCss={bootstrapCss} />) : null;

		const pagination = query.pageStrategy === "paginate" ?
			<PaginateComponent {...this.props} bootstrapCss={bootstrapCss} onChange={onPageChange} /> :
			null;

		const preloadListItem = query.pageStrategy === "cursor" && results.docs.length < results.numFound ?
			<PreloadComponent {...this.props} /> : null;

		var me = this;
		var reversedBase = this.state.sortBaseComponents.slice();

		return (
			<div className={cx("solr-faceted-search", {"container": bootstrapCss, "col-md-12": bootstrapCss})}>
				<SearchFieldContainerComponent bootstrapCss={bootstrapCss} onNewSearch={this.props.onNewSearch}>
					{searchFields.map((searchField, i) => {
						const { type, field, lowerBound, upperBound } = searchField;
						const SearchComponent = customComponents.searchFields[type];
						const facets = getFacetValues(type, results, field, lowerBound, upperBound);
						if (searchField.label === "General Search")
						{
							searchField.collapse = false;
						}

						return (<SearchComponent
							key={i} {...this.props} {...searchField}
							bootstrapCss={bootstrapCss}
							facets={facets}
							truncateFacetListsAt={truncateFacetListsAt}
							onChange={onSearchFieldChange} />
						);
					})}
				</SearchFieldContainerComponent>

				<ResultContainerComponent bootstrapCss={bootstrapCss}>
					<ResultHeaderComponent bootstrapCss={bootstrapCss}>
						<ResultCount bootstrapCss={bootstrapCss} numFound={results.numFound} />
						{resultPending}

					{
						reversedBase.map(function(sortBaseIndex, index){
							return <SortComponent keyIndex={sortBaseIndex} key={index} bootstrapCss={bootstrapCss} onChange={me.checkOnChange} sortFields={sortFields} />
            })
					}

						{this.props.showCsvExport
							? <CsvExportComponent bootstrapCss={bootstrapCss} onClick={onCsvExport} />
							: null}
					</ResultHeaderComponent>
					<CurrentQueryComponent {...this.props} onChange={onSearchFieldChange} />
					{pagination}
					<ResultListComponent bootstrapCss={bootstrapCss}>
						{results.docs.map((doc, i) => (
							<ResultComponent bootstrapCss={bootstrapCss}
								doc={doc}
								fields={searchFields}
								key={doc.id || i}
								onSelect={this.props.onSelectDoc}
								resultIndex={i}
								rows={rows}
								start={start}
							/>
						))}
						{preloadListItem}
					</ResultListComponent>
					{pagination}
				</ResultContainerComponent>
			</div>
		);
	}
}

SolrFacetedSearch.defaultProps = {
	bootstrapCss: true,
	customComponents: componentPack,
	pageStrategy: "paginate",
	rows: 20,
	searchFields: [
		{type: "text", field: "*"}
	],
	sortFields: [],
	truncateFacetListsAt: -1,
	showCsvExport: false,
};

SolrFacetedSearch.propTypes = {
	bootstrapCss: React.PropTypes.bool,
	customComponents: React.PropTypes.object,
	onCsvExport: React.PropTypes.func,
	onNewSearch: React.PropTypes.func,
	onPageChange: React.PropTypes.func,
	onSearchFieldChange: React.PropTypes.func.isRequired,
	onSelectDoc: React.PropTypes.func,
	onSortFieldChange: React.PropTypes.func.isRequired,
	query: React.PropTypes.object,
	results: React.PropTypes.object,
	showCsvExport: React.PropTypes.bool,
	truncateFacetListsAt: React.PropTypes.number
};

export default SolrFacetedSearch;
