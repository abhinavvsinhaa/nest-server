export const dates = {
    convert: function (d: any) {
        return (
            d
        );
    },
    compare: function (a: Date, b: Date) {
        return (
            isFinite(a = this.convert(a).valueOf()) &&
                isFinite(b = this.convert(b).valueOf()) ?
                (a > b) ? true : false :
                NaN
        );
    }
}