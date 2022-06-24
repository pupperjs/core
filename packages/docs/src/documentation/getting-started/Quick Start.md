## Quick Start

A build setup allows us to use pupper Single-File Components (SFCs).
You can integrate it with your preferred build tool:

- webpack:
    <br/>

    Install the loader by using your preferred package manager:
    ```bash
    yarn add @pupper/webpack-loader -D
    ```

    or

    ```bash
    npm i @pupper/webpack-loader -D
    ```

    <br/>

    *webpack.config.json*
    ```javascript
    module.exports = {
        module: {
            rules: [
                {
                    // Will test for .pup and .pupper files
                    test: /\.pup(per)?$/,
                    use: ["@pupperjs/webpack-loader"]
                }
            ]
        }
    }
    ```