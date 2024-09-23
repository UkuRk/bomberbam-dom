import Router from "../routinglogic/routing.js";

import { vNode, render, diff, patch } from "./engine.js";

export default class Framework {
    constructor() {

        this.routes = [];

        this.router = new Router(this);

        this._components = [];

        this.oldNode = {};
        this._init();
    }

    _init() {
        this.oldNode = vNode("main", { id: "root" }, ...this._components);
        const initNode = render(this.oldNode);
        document.body.appendChild(initNode);
    }

    setRoutes(routes) {
        this.router.init(routes);
    }

    bindLink(component, href) {
        const route = {};
        this.routes.push((route[href] = component));
        component.actionListener("click", () => {
            this.router.navigateTo(href);
        });
    }

    async addComponent(component) {
        this._components.push(component);
        await this.render(component);
    }

    async clear() {
        this._components.length = 0
        await this.render()
    }

    async replaceComponent(component) {
        this.clear();
        this.addComponent(component)
    }

    async render() {
        const newNode = vNode("main", { id: "root" }, ...this._components);
        const patches = diff(this.oldNode, newNode);
        await patch(document.body.lastChild, patches);
        this.oldNode = newNode;
    }
}

