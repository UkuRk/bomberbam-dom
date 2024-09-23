import Component from "./component.js";

export default class Form extends Component {
    constructor(props, ...inputs) {
        super("form", props);
        this.props.className = "form";
        return this.init(...inputs);
    }

    init(...inputs) {
        const form = this.addElement(...inputs);
        return form;
    }
}