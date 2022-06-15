import Template from "./templates/template.pupper";

(async function() {
    window.component = Template;
    await Template.mount(document.getElementById("app"));

    Template.puppies.push({
        id: 3,
        title: "Wow, a shibe!",
        description: "Cute shiberino!!!",
        thumbnail: "https://media.istockphoto.com/photos/happy-shiba-inu-dog-on-yellow-redhaired-japanese-dog-smile-portrait-picture-id1197121742?k=20&m=1197121742&s=170667a&w=0&h=SDkUmO-JcBKWXl7qK2GifsYzVH19D7e6DAjNpAGJP2M=",
        shibe: true
    });
}());