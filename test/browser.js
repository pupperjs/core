const { default: Renderer } = require("../out/core/Renderer");

const template = new Renderer(require("./template.pupper"));

window.data = {
    item: {
        title: "This is a title",
        description: "This is a description",
        thumbnail: "https://placedog.net/800"
    }
};

template.setData(data);

window.template = template;

template.renderTo(document.getElementById("app"));