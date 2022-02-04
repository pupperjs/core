const { Component } = require("../out/core/Component");

const pupper = new Component({
    template: require("./template.pupper"),
    methods: {
        onClickPuppy(e) {
            alert("You clicked a puppy! :D");
        }
    },
    data: {
        page: {
            title: "pupper.js is awesome!",
            description: "I use pupper.js because I love puppies!",
            lead: "Also we love puppers, shiberinos and other doggos too! 🐶"
        },
        puppies: [
            {
                id: 1,
                title: "A cutie pup",
                description: "Look at this cutie",
                thumbnail: "https://placedog.net/800"
            },
            {
                id: 2,
                title: "Another cute pup",
                description: "Isn't it a cute doggo?!",
                thumbnail: "https://placedog.net/400"
            }
        ]
    }
});

window.component = pupper;
pupper.renderTo(document.getElementById("app"));

pupper.data.puppies.push({
    id: 3,
    title: "Wow, a shibe!",
    description: "Cute shiberino!!!",
    thumbnail: "https://media.istockphoto.com/photos/happy-shiba-inu-dog-on-yellow-redhaired-japanese-dog-smile-portrait-picture-id1197121742?k=20&m=1197121742&s=170667a&w=0&h=SDkUmO-JcBKWXl7qK2GifsYzVH19D7e6DAjNpAGJP2M=",
    shibe: true
});