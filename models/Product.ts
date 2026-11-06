import mongoose from "mongoose";

export type ProductColor = Record<string, string>;

export interface IProduct {
    title: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    keyFeatures: string[];
    images: string[];
    _id?: mongoose.Types.ObjectId;
    stock: number;
    category: string;
    subcategory?: string;
    isTrending?: boolean;
    createdAt?: Date;
    updatedAt?: Date; 
    colors?: ProductColor[]
    avgRating?: number;
reviewCount?: number;
}

const productSchema = new mongoose.Schema<IProduct>({
    title: { type: String, required: true},
    description: { type: String, required: true},
    price: {type: Number, required: true},
    discountPrice: { type: Number, default: null, min: 0 },
    keyFeatures: [{type: String}],
    images: [{type: String}],
    stock: {type: Number, default: 5},
    category: {type: String, required: true},
    subcategory: {type: String},
    colors: [{ type: mongoose.Schema.Types.Mixed }],
    isTrending: {type: Boolean, default: false},
    avgRating: {
  type: Number,
  default: 0,
},
reviewCount: {
  type: Number,
  default: 0,
}
}, { timestamps: true
})

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;