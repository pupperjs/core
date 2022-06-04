module.exports = {
    entry: __dirname + "/test/index.js",
    output: {
        path: __dirname + "/test/out",
        filename: "index.js",
        publicPath: "./"
    },
    cache: false,
    watch: true,
    mode: "development",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.pupper$/,
                use: ["@pupperjs/webpack-loader"]
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ]
    },
    resolve: {
        alias: {
            "pupper.js": __dirname + "/out/"
        }
    },
    mode: "development"
}