const rangeFacetToQueryFilter = (field) => {
	const filters = field.value || [];
	if (filters.length < 2) {
		return null;
	}

	return encodeURIComponent(`${field.field}:[${filters[0]} TO ${filters[1]}]`);
};

const periodRangeFacetToQueryFilter = (field) => {
	const filters = field.value || [];
	if (filters.length < 2) {
		return null;
	}

	return encodeURIComponent(
		`${field.lowerBound}:[${filters[0]} TO ${filters[1]}] OR ` +
		`${field.upperBound}:[${filters[0]} TO ${filters[1]}] OR ` +
		`(${field.lowerBound}:[* TO ${filters[0]}] AND ${field.upperBound}:[${filters[1]} TO *])`
	);
};

const listFacetFieldToQueryFilter = (field) => {
	const filters = field.value || [];
	if (filters.length === 0) {
		return null;
	}

	const filterQ = filters.map((f) => `"${f}"`).join(" OR ");
	return encodeURIComponent(`${field.field}:(${filterQ})`);
};

const textFieldToQueryFilter = (field) => {
	if(!field.value || field.value.length === 0) {
		return null;
	}

	return encodeURIComponent(field.field === "*" ? field.value : `${field.field}:${field.value}`);
};

const dateRangeFacetToQueryFilter = (field) => {
const filters = (field.value !== undefined && field.value !== null) ? field.value.toString().split(" ") : [];
	if (filters.length < 2) {
		return null;
	}
return encodeURIComponent(`${field.field}:[${filters[0]} TO ${filters[1]}]`);
};

var pathQuery = "";
const getPathQuery = (field) => {
		if (field.value !== undefined
			&& field.value !== null
			&& field.value !== "")
		{
			pathQuery = field.value.replace(/([\ \!\+\&\|\(\)\[\]\{\}\^\:\"\\])/g, "\\$1");
			pathQuery = encodeURIComponent(`${field.field}:${pathQuery}`);
		}
		else {
			pathQuery = "";
		}
	return null;
};

const fieldToQueryFilter = (field) => {
	if (field.field === "path_s")
	{
		return getPathQuery(field);
	}	else if (field.type === "text") {
		return textFieldToQueryFilter(field);
	} else if (field.type === "list-facet") {
		return listFacetFieldToQueryFilter(field);
	} else if (field.type === "range-facet" || field.type === "range") {
		return rangeFacetToQueryFilter(field);
	}else if (field.type === "date-range-facet") {
		return dateRangeFacetToQueryFilter(field);
	}else if (field.type === "period-range-facet" || field.type === "period-range") {
		return periodRangeFacetToQueryFilter(field);
	} 	return null;
};

const buildQuery = (fields) => fields
	.map(fieldToQueryFilter)
	.filter((queryFilter) => queryFilter !== null)
	.map((queryFilter) => `fq=${queryFilter}`)
	.join("&");

const facetFields = (fields) => fields
	.filter((field) => field.type === "list-facet" || field.type === "range-facet" || field.type === "date-range-facet")
	.map((field) => `facet.field=${encodeURIComponent(field.field)}`)
	.concat(
		fields
			.filter((field) => field.type === "period-range-facet")
			.map((field) => `facet.field=${encodeURIComponent(field.lowerBound)}&facet.field=${encodeURIComponent(field.upperBound)}`)
	)
	.join("&");

const facetSorts = (fields) => fields
	.filter((field) => field.facetSort)
	.map((field) => `f.${encodeURIComponent(field.field)}.facet.sort=${field.facetSort}`)
	.join("&");

const buildSort = (sortFields) => sortFields
	.filter((sortField) => sortField.value)
	.map((sortField) => encodeURIComponent(`${sortField.field} ${sortField.value}`))
	.join(",");

const buildFormat = (format) => Object.keys(format)
	.map((key) => `${key}=${encodeURIComponent(format[key])}`)
	.join("&");

const solrQuery = (query, format = {wt: "json"},  noAttachments = true) => {
	const {
			searchFields,
			sortFields,
			rows,
			start,
			facetLimit,
			facetSort,
			pageStrategy,
			cursorMark,
			idField
		} = query;

	const filters = (query.filters || []).map((filter) => ({...filter, type: filter.type || "text"}));
	const queryParams = buildQuery(searchFields.concat(filters));

	const facetFieldParam = facetFields(searchFields);
	var facetSortParams = facetSorts(sortFields);
	const facetLimitParam = `facet.limit=${facetLimit || -1}`;
	const facetSortParam = `facet.sort=${facetSort || "index"}`;
	const addAttachment = (noAttachments) ? " AND subject_s:*": "";

	const cursorMarkParam = pageStrategy === "cursor" ? `cursorMark=${encodeURIComponent(cursorMark || "*")}` : "";
	const idSort = pageStrategy === "cursor" ? [{field: idField, value: "asc"}] : [];

	var tempSortFields = sortFields.slice();
	tempSortFields.reverse();

	const sortParam = buildSort(tempSortFields.concat(idSort));

	var defaultSortParam = encodeURIComponent("sent_on_dt desc");

	return `q=*:*${encodeURIComponent(addAttachment)}` +
		`&${queryParams.length > 0 ? queryParams : ""}` +
		`${sortParam.length > 0 && sortParam !== defaultSortParam ? `&sort=${sortParam}, ${defaultSortParam} ` : `&sort=${defaultSortParam}` }` +
		`${facetFieldParam.length > 0 ? `&${facetFieldParam}` : ""}` +
		`${facetSortParams.length > 0 ? `&${facetSortParams}` : ""}` +
		`${pathQuery !== "" ? `&facet.field=path_s&fq=${pathQuery}` : ""}` +
		`&rows=${rows}` +
		`&${facetLimitParam}` +
		`&${facetSortParam}` +
		`&${cursorMarkParam}` +
		(start === null ? "" : `&start=${start}`) +
		"&facet=on" +
		`&${buildFormat(format)}`;
};

export default solrQuery;


export {
	rangeFacetToQueryFilter,
	periodRangeFacetToQueryFilter,
	listFacetFieldToQueryFilter,
	textFieldToQueryFilter,
	fieldToQueryFilter,
	buildQuery,
	facetFields,
	facetSorts,
	buildSort,
	solrQuery
};
