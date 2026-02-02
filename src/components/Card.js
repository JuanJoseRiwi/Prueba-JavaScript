// javascript
import JsonService from '../services/jsonService.js';

export async function Card(productId, isAdmin = false) {
    const service = new JsonService();
    const product_response = await service.getProductById(productId);

    const data = {
        id: product_response.id,
        title: product_response.name,
        price: product_response.price,
        description: product_response.description,
        img: product_response.img,
        stock: product_response.stock,
        category: product_response.category
    };

    const adminControls = isAdmin
        ? `
            <div class="admin-product-actions">
                <button class="button tertiary small edit-product-btn" data-id="${data.id}">Edit</button>
                <button class="button tertiary small delete-product-btn" data-id="${data.id}">Delete</button>
            </div>
        `
        : '';

    const inStock = Number(data.stock) > 0;
    const formattedPrice = (Number(data.price) || 0).toFixed(2);

    return `
        <article class="card product modern-card">
            <div class="card-media">
                <img src="${data.img || 'https://via.placeholder.com/160x120?text=No+Image'}" alt="${data.title}">
                <span class="tag ${inStock ? 'in-stock' : 'out-of-stock'}">${inStock ? 'In stock' : 'Out of stock'}</span>
            </div>
            <div class="card-body">
                <div class="card-header">
                    <h3 class="card-title">${data.title}</h3>
                    <span class="card-category">${data.category || ''}</span>
                </div>

                <p class="card-desc">${(data.description || '').slice(0,120)}${(data.description||'').length>120? '...':''}</p>

                <div class="card-meta">
                    <div class="price">$ ${formattedPrice}</div>
                    <div class="actions">
                        <button class="button primary add-to-cart-btn" data-id="${data.id}">Add</button>
                        ${adminControls}
                    </div>
                </div>
            </div>
        </article>
    `;
}
