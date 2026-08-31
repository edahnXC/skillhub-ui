export interface Course{
    id:number;
    title:string;
    description:string;
    price:number;
    discountPrice:number|null;
    thumbnailUrl:string;
    isPublished:boolean;
    instructorId?:number;
    categoryName:string;
    instructorName:string;
}