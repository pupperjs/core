declare module "virtual-dom/vnode/vcomment" {
    import VCommentConstructor = VirtualDOM.VCommentConstructor;
    const VComment: VCommentConstructor;
    export = VComment;
}

declare module "virtual-dom/vnode/is-vcomment" {
    import isVComment = VirtualDOM.isVComment;
    export = isVComment;
}