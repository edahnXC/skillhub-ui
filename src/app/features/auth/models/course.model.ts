export interface Course
{
    id:number;

    title:string;

    description:string;

    price:number;

    discountPrice:number | null;

    thumbnailUrl:string | null;

    isPublished:boolean;

    categoryName:string;

    instructorName:string;
}