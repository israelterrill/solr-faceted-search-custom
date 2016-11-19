import React from "react";
import ReactDOM from "react-dom";
import cx from "classnames";

export const SORT_MENU_MAX = 10;

class SortMenu extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpen: false,
		};

		this.documentClickListener = this.handleDocumentClick.bind(this);
	}

	componentDidMount() {
		document.addEventListener("click", this.documentClickListener, false);
	}

	componentWillUnmount() {
		document.removeEventListener("click", this.documentClickListener, false);
	}

	toggleSelect() {
		if(this.state.isOpen) {
			this.setState({isOpen: false});
		} else {
			this.setState({isOpen: true});
		}
	}

	onSelect(sortField) {
		var foundIdx = -1;

		for (var i = 0; i < this.props.sortFields.length; i++)
		{
			if (this.props.sortFields[i].field === sortField)
			{
				foundIdx = i;
			}
		}

		if (foundIdx >= 0)
		{
				this.props.onChange(sortField, "asc", this.props.keyIndex);
		} else {
				this.props.onChange(sortField, null, SORT_MENU_MAX);
		}
	}

	onDelete(sortField) {
			this.props.onChange(sortField, null, SORT_MENU_MAX);
	}

	handleDocumentClick(ev) {
		const { isOpen } = this.state;
		if (isOpen && !ReactDOM.findDOMNode(this).contains(ev.target)) {
			this.setState({
				isOpen: false
			});
		}
	}

	render() {
		const { bootstrapCss, sortFields } = this.props;
		if (sortFields.length === 0) { return null; }

		var foundIdx = -1;
		for (var i = 0; i < sortFields.length; i++)
		{
			if (sortFields[i].priority === this.props.keyIndex)
			{
				foundIdx = i;
				break;
			}
		}

		var value = null;
		if (foundIdx >= 0)
		{
			value = sortFields[foundIdx];
		}
		return (
			<span className={cx({"pull-right": bootstrapCss})}>
				<span className={cx({"dropdown": bootstrapCss, "open": this.state.isOpen})}>
					<button className={cx({"btn": bootstrapCss, "btn-default": bootstrapCss, "btn-xs": bootstrapCss, "dropdown-toggle": bootstrapCss})}
						onClick={this.toggleSelect.bind(this)}>
						{value ? value.label : "- select sort -"} <span className="caret"></span>
					</button>
					<ul className="dropdown-menu">
						{sortFields.map((sortField, i) => (
							<li key={i}>
								<a onClick={() => { this.onSelect(sortField.field); this.toggleSelect(); }}>{sortField.label}</a>
							</li>
						))}
						{value ? (
							<li>
								<a onClick={() => { this.onDelete(value.field); this.toggleSelect();}}>
									- clear -
								</a>
							</li>
						) : null}
					</ul>
				</span>
				{value ? (
					<span className={cx({"btn-group": bootstrapCss})}>
						<button className={cx({"btn": bootstrapCss, "btn-default": bootstrapCss, "btn-xs": bootstrapCss, active: value.value === "asc"})}
							onClick={() => this.props.onChange(value.field, "asc", this.props.keyIndex) }>
							asc
						</button>
						<button className={cx({"btn": bootstrapCss, "btn-default": bootstrapCss, "btn-xs": bootstrapCss, active: value.value === "desc"})}
							onClick={() => this.props.onChange(value.field, "desc", this.props.keyIndex)}>
							desc
						</button>
					</span>
				) : null}
			</span>
		);
	}
}

SortMenu.propTypes = {
	bootstrapCss: React.PropTypes.bool,
	onChange: React.PropTypes.func,
	sortFields: React.PropTypes.array,
	sortKey: React.PropTypes.number
};

export default SortMenu;
