import mongoose from "mongoose";

export interface IProduct {
    title: string;
    description: string;
    price: number;
    keyFeatures: string[];
    images: string[];
    _id?: mongoose.Types.ObjectId;
    stock: number;
    category: string;
    subcategory?: string;
    isTrending?: boolean;
    createdAt?: Date;
    updatedAt?: Date; 
}

const productSchema = new mongoose.Schema<IProduct>({
    title: { type: String, required: true},
    description: { type: String, required: true},
    price: {type: Number, required: true},
    keyFeatures: [{type: String}],
    images: [{type: String}],
    stock: {type: Number, default: 5},
    category: {type: String, required: true},
    subcategory: {type: String},
    isTrending: {type: Boolean, default: false}
}, { timestamps: true
})

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;