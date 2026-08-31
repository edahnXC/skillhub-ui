export interface CreateCourseRequest
{
    title:string;

    description:string;

    price:number;

    discountPrice:number | null;

    thumbnailUrl:string;

    categoryId:number;
}