import React, { useState } from 'react';
import { apiService } from '../../services/api';

function RecipesTab({ user, products, recipes, onSuccess }) {
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeItems, setNewRecipeItems] = useState([]);
  const [selRecipeProduct, setSelRecipeProduct] = useState('');
  const [selRecipeQty, setSelRecipeQty] = useState('');
  const [attRecipe, setAttRecipe] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExecuteRecipe = async (recipeId) => {
    const batches = prompt("¿Cuántas unidades del producto final vas a producir?");
    if (!batches || isNaN(batches)) return;
    const outProd = prompt("¿Cuál es el nombre del producto final que ingresará al Kardex?");
    if (!outProd) return;
    
    setIsProcessing(true);
    try {
      await apiService.executeRecipe(recipeId, {
        user: user.username,
        batches: parseFloat(batches),
        output_product_name: outProd.trim().toUpperCase().replace(/\s+/g, '_'),
        lot_code: `PROD-${new Date().getTime()}`,
        expiration_date: ''
      });
      alert("Producción ejecutada! Se descontaron los insumos y se ingresó el producto final.");
      onSuccess();
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    setAttRecipe(true);
    if (!newRecipeName || newRecipeItems.length === 0) {
      return;
    }
    setIsProcessing(true);
    try {
      await apiService.createRecipe({
        name: newRecipeName,
        created_by: user.username,
        items: newRecipeItems
      });
      alert("Receta creada exitosamente");
      setNewRecipeName('');
      setNewRecipeItems([]);
      setShowRecipeForm(false);
      setAttRecipe(false);
      onSuccess();
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRecipeItem = () => {
    if(!selRecipeProduct || !selRecipeQty) return;
    const p = products.find(x => x.id.toString() === selRecipeProduct);
    if(p) {
      setNewRecipeItems([...newRecipeItems, { product_id: p.id, name: p.name, qty: parseFloat(selRecipeQty) }]);
      setSelRecipeProduct('');
      setSelRecipeQty('');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Módulo de Producción (Recetas)</h3>
        <button className="btn-primary" onClick={() => setShowRecipeForm(!showRecipeForm)}>
          {showRecipeForm ? 'Cancelar' : '+ Nueva Receta'}
        </button>
      </div>

      {showRecipeForm && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
          <h4>Crear Nueva Receta</h4>
          <form onSubmit={handleCreateRecipe} style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nombre de la Receta (Kit/Combo)</label>
              <input type="text" className="input-premium" value={newRecipeName} onChange={e => {
                let val = e.target.value.toUpperCase();
                val = val.replace(/\s+/g, '_');
                setNewRecipeName(val);
              }} />
              {attRecipe && !newRecipeName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>El campo es obligatorio.</span>}
            </div>
            
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', marginBottom: '16px' }}>
              <h5 style={{ margin: '0 0 12px 0' }}>Insumos requeridos:</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Insumo</label>
                  <select className="input-premium" value={selRecipeProduct} onChange={e => setSelRecipeProduct(e.target.value)}>
                    <option value="">-- Seleccionar --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Cant.</label>
                  <input type="number" step="0.01" className="input-premium" value={selRecipeQty} onChange={e => setSelRecipeQty(e.target.value)} />
                </div>
                <button type="button" className="btn-primary" onClick={handleAddRecipeItem} style={{ padding: '14px', height: 'fit-content' }}>Añadir</button>
              </div>
              
              {newRecipeItems.length > 0 && (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {newRecipeItems.map((it, idx) => (
                    <li key={idx}><strong>{it.qty}</strong> de {it.name}</li>
                  ))}
                </ul>
              )}
              {attRecipe && newRecipeItems.length === 0 && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px', display: 'block' }}>Agregue al menos un insumo.</span>}
            </div>
            
            <button type="submit" className="btn-primary" disabled={isProcessing} style={{ width: '100%', padding: '14px' }}>
              {isProcessing ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </form>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {recipes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay recetas creadas.</p>
        ) : (
          recipes.map(recipe => (
            <div key={recipe.id} style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>{recipe.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Insumos requeridos por lote:</p>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '16px' }}>
                {recipe.items.map((item, idx) => (
                  <li key={idx}><strong>{item.qty} {item.unit}</strong> de {item.product_name}</li>
                ))}
              </ul>
              <button className="btn-primary" onClick={() => handleExecuteRecipe(recipe.id)} disabled={isProcessing} style={{ width: '100%' }}>
                🚀 Ejecutar Producción
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecipesTab;
