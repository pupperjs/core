namespace VirtualDOM {
    interface VComment {
        comment: string;
        version: string;
        type: string;
    }

    function isVComment(x: any): boolean;
    
    interface VCommentConstructor {
        new (comment: string): VComment;
    }

    type VTree = VText | VComment | VNode | Widget | Thunk;

    declare interface h {
        c(comment: string): VComment;
    }
}