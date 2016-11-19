import React from "react";
import cx from "classnames";
import SearchIcon from "../icons/search";
var Datetime = require ('react-datetime');
var moment = require ('../../../node_modules/moment');


class DateRangeSearch extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			startDate: null,
			endDate: null,
			datetime1: () => <Datetime defaultValue="*" onChange={this.onStartRangeChange.bind(this)} closeOnSelect={true}/>,
			datetime2: () => <Datetime defaultValue="NOW" onChange={this.onEndRangeChange.bind(this)} closeOnSelect={true}/>,
			value: ""
		};
		;
		this.clearComponent = this.clearComponent.bind(this);
		this.clearStartComponent = this.clearStartComponent.bind(this);
		this.clearEndComponent = this.clearEndComponent.bind(this);

		this.buildQuery = this.buildQuery.bind(this);
		this.isValidDateString = this.isValidDateString.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
}

	clearComponent() {
    this.setState({
			startDate: null,
			endDate: null,
			value: "",
			datetime1: () => <Datetime defaultValue="*" onChange={this.onStartRangeChange.bind(this)} closeOnSelect={true}/>,
			datetime2: () => <Datetime defaultValue="NOW" onChange={this.onEndRangeChange.bind(this)} closeOnSelect={true}/>,
	  });
  }

	clearStartComponent() {
    this.setState({
			startDate: null,
			datetime1: () => <Datetime defaultValue="*" onChange={this.onStartRangeChange.bind(this)} closeOnSelect={true}/>,
	  });
  }
	clearEndComponent() {
    this.setState({
			endDate: null,
			datetime2: () => <Datetime defaultValue="NOW" onChange={this.onEndRangeChange.bind(this)} closeOnSelect={true}/>,
	  });
  }

	isValidDateString(value)
	{
		return !isNaN(Date.parse(value));
	}

	buildQuery()
	{
		var invalidStart = false;
		var invalidEnd = false;
		if (this.state.startDate !== null
			&& this.state.startDate._isValid !== true)
		{
			this.clearStartComponent();
			invalidStart = true;
		}

		if (this.state.endDate !== null
			&& this.state.endDate._isValid !== true)
		{
				invalidEnd = true;
				this.clearEndComponent();
		}

		var startVal = (this.state.startDate !== undefined && this.state.startDate !== null && !invalidStart) ? moment.utc(this.state.startDate).toISOString() : "*";
		var endVal = (this.state.endDate !== undefined && this.state.endDate !== null && !invalidEnd) ? moment.utc(this.state.endDate).toISOString() : "NOW";
		var queryString =  startVal + " " + endVal;
		this.setState({
			value: queryString
		});
		return queryString;
	}

	onStartRangeChange(value)
	{
			this.setState({
					startDate: value
				});
	}

	onEndRangeChange(value)
	{
			this.setState({
					endDate: value
				});
	}

	componentWillReceiveProps(nextProps) {
	if (nextProps.value === undefined)
		{
			this.clearComponent();
			this.setState({
				value: this.props.defaultValue
			});
		}
		else {
			this.setState({
				value: nextProps.value
			});
		}
	}

handleInputKeyDown(ev) {
console.log("KEY");
		if (ev.keyCode === 13) {
			this.handleSubmit();
		}
	}

	handleSubmit() {
		var queryString = this.buildQuery();
		this.props.onChange(this.props.field, queryString);
	}

	toggleExpand() {
		this.props.onSetCollapse(this.props.field, !(this.props.collapse || false));
	}

	render() {
    const Date1 = this.state.datetime1;
    const Date2 = this.state.datetime2;
		const { label, bootstrapCss, collapse } = this.props;

		return (
			<li className={cx({"list-group-item": bootstrapCss})}>
				<header onClick={this.toggleExpand.bind(this)}>
					<h5>
						{bootstrapCss ? (<span>
							<span className={cx("glyphicon", {
								"glyphicon-collapse-down": !collapse,
								"glyphicon-collapse-up": collapse
							})} />{" "}
						</span>) : null }
							Date Range
					</h5>
				</header>
				<div style={{display: collapse ? "none" : "block"}}>
					<Date1 />
					<button className={cx({"btn": bootstrapCss, "btn-default": bootstrapCss, "btn-sm": bootstrapCss})} onClick={this.handleSubmit.bind(this)}>
						<SearchIcon />
					</button>
					<br/>
					<Date2 />
					<button className={cx({"btn": bootstrapCss, "btn-default": bootstrapCss, "btn-sm": bootstrapCss})} onClick={this.handleSubmit.bind(this)}>
						<SearchIcon />
					</button>
				</div>
			</li>
		);
	}
}

DateRangeSearch.defaultProps = {
	field: "date-range-facet",
	collapse: true
};

DateRangeSearch.propTypes = {
	bootstrapCss: React.PropTypes.bool,
	collapse: React.PropTypes.bool,
	field: React.PropTypes.string.isRequired,
	label: React.PropTypes.string,
	onChange: React.PropTypes.func,
	onSetCollapse: React.PropTypes.func
};

export default DateRangeSearch;
