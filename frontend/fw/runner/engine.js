import Component from "../blocks/component.js";

// Create virtual node
export const vNode = (tag, props, ...children) => (new Component(tag, props, children));

// Render virtual node
export const render = (vNode) => {
    if (typeof vNode === 'string') {
        return document.createTextNode(vNode);
    }
    const node = document.createElement(vNode.tag);
    if (typeof vNode.props === 'object' && vNode.props !== null) {
        for (const [prop, value] of Object.entries(vNode.props)) {
            if (node[prop] !== undefined) {
                node[prop] = value;
            } else {
                node.setAttribute(prop, value);
            }
        }
    }
    for (const child of vNode.children || []) {
        node.appendChild(render(child));
    }
    return node;
};
// Compare new virtual node with old virtual node
export const diff = (v1, v2) => {
    const patches = [];

    if (typeof v1 === 'string' || typeof v2 === 'string') {
        if (v1 !== v2) {
            patches.push({ tag: 'TEXT', value: v2 });
        }
    } else if (v1.tag !== v2.tag) {
        patches.push({ tag: 'REPLACE', value: v2 });
    } else if (v1.tag === v2.tag) {
        if (JSON.stringify(v1.props) !== JSON.stringify(v2.props)) {
            patches.push({ tag: 'PROPS', value: v2.props });
        }
        if (JSON.stringify(v1.children) !== JSON.stringify(v2.children)) {
            patches.push({ tag: 'CHILDREN', value: v2.children });
        }
    }
    return patches;
};
// Apply patches to the real DOM
export const patch = async (node, patches) => {
    for (const patch of patches) {
        switch (patch.tag) {
            case 'REMOVE':
                node.remove();
                break;
            case 'TEXT':
                node.textContent = patch.value;
                break;
            case 'REPLACE':
                node.parentNode.replaceChild(render(patch.value), node);
                break;
            case 'PROPS':
                for (const [prop, value] of Object.entries(patch.value)) {
                    node[prop] = value;
                }
                break;
            case 'CHILDREN':
                node.textContent = '';
                patch.value.map((child) => {
                    node.appendChild(render(child));
                })
                break;
        }
    }
};
//   Retrieves the values of a form and returns them as an object.
export const getFormValues = (form) => {
    const values = new FormData(form)
    const data = Object.fromEntries(values.entries())
    return data
}
