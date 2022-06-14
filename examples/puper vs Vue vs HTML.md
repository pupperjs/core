# pupper.js vs Vue vs HTML

## To-do list

- pupper
    ```pug
    template
        ul
            each index, todo in list
                li(@click="removeItem(index)")
                    ={{todo}}

    data
        list = [
            "Make pancakes."
        ]

    implementation
        #removeItem(index)
            this.list.splice(index, 1);
    ```

- Vue
    ```html
    <template>
        <ul>
            <li v-for="index in list" @click="removeItem(index)">
                {{list[index]}}
            </li>
        </ul>
    </template>

    <script>
    import { defineComponent } from "vue";

    export default defineComponent({
        data() {
            return {
                list: [
                    "Make pancakes."
                ]
            }
        },
        methods: {
            removeItem(index) {
                this.list.splice(index, 1);
            }
        }
    })
    </script>
    ```

- HTML
    ```html
    <ul></ul>

    <script>
        let list = [
            "Make pancakes."
        ];

        const ul = document.querySelector("ul");

        for(let todo of list) {
            const li = document.createElement("li");
            li.innerText = todo;

            ul.appendChild(li);

            li.addEventListener("click", (e) => {
                e.preventDefault();
                li.remove();
            });
        }
    </script>
    ```