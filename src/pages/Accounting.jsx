import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Trash2, DollarSign, FileText, Calendar, ArrowUpRight, ArrowDownLeft, Upload, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';

const Accounting = () => {
    const { expenses, addExpense, deleteExpense, uploadReceipt } = useGame();
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        mva_rate: 25,
        type: 'payable',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        category: '',
        receipt_url: ''
    });

    const calculateTotals = () => {
        const amount = parseFloat(formData.amount) || 0;
        const mvaRate = parseInt(formData.mva_rate) || 0;
        const mvaAmount = (amount * mvaRate) / 100;
        const totalAmount = amount + mvaAmount;
        return { mvaAmount, totalAmount };
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadReceipt(file);
            if (url) {
                setFormData({ ...formData, receipt_url: url });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload receipt. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { mvaAmount, totalAmount } = calculateTotals();

        await addExpense({
            ...formData,
            amount: parseFloat(formData.amount),
            mva_amount: mvaAmount,
            total_amount: totalAmount
        });

        setIsAdding(false);
        setFormData({
            description: '',
            amount: '',
            mva_rate: 25,
            type: 'payable',
            invoice_number: '',
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: '',
            category: '',
            receipt_url: ''
        });
    };

    const totalPayable = expenses
        .filter(e => e.type === 'payable')
        .reduce((sum, e) => sum + (parseFloat(e.total_amount) || 0), 0);

    const totalReceivable = expenses
        .filter(e => e.type === 'receivable')
        .reduce((sum, e) => sum + (parseFloat(e.total_amount) || 0), 0);

    return (
        <div className="container fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/" className="btn btn-icon" title="Back to Dashboard">
                        <ArrowDownLeft size={24} style={{ transform: 'rotate(45deg)' }} />
                    </Link>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Accounting</h1>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> New Entry
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ borderColor: 'var(--color-danger)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(255, 70, 85, 0.1)', color: 'var(--color-danger)' }}>
                            <ArrowUpRight size={24} />
                        </div>
                        <h3>I Owe (Payable)</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                        {totalPayable.toFixed(2)} NOK
                    </div>
                </div>

                <div className="card" style={{ borderColor: 'var(--color-success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(0, 255, 150, 0.1)', color: 'var(--color-success)' }}>
                            <ArrowDownLeft size={24} />
                        </div>
                        <h3>Owed to Me (Receivable)</h3>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                        {totalReceivable.toFixed(2)} NOK
                    </div>
                </div>
            </div>

            {/* Add Entry Form */}
            {isAdding && (
                <div className="card fade-in" style={{ marginBottom: '2rem', border: '1px solid var(--color-primary)' }}>
                    <h2 style={{ marginTop: 0 }}>New Entry</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                >
                                    <option value="payable">Payable (Expense)</option>
                                    <option value="receivable">Receivable (Income)</option>
                                </select>
                            </div>
                            <div>
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Software, Office, Client X"
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label>Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                                placeholder="What is this for?"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Amount (ex. MVA)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label>MVA Rate (%)</label>
                                <select
                                    value={formData.mva_rate}
                                    onChange={e => setFormData({ ...formData, mva_rate: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                >
                                    <option value="0">0%</option>
                                    <option value="15">15%</option>
                                    <option value="25">25%</option>
                                </select>
                            </div>
                            <div>
                                <label>Total (inc. MVA)</label>
                                <div style={{ padding: '0.5rem', marginTop: '0.25rem', background: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                                    {calculateTotals().totalAmount.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Invoice Number</label>
                                <input
                                    type="text"
                                    value={formData.invoice_number}
                                    onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label>Invoice Date</label>
                                <input
                                    type="date"
                                    value={formData.invoice_date}
                                    onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                />
                            </div>
                            <div>
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label>Receipt / Document</label>
                            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label className="btn btn-accent" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                        disabled={uploading}
                                        accept="image/*,.pdf"
                                    />
                                </label>
                                {formData.receipt_url && (
                                    <span style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>
                                        File attached!
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn" onClick={() => setIsAdding(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={uploading}>Save Entry</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Description</th>
                            <th style={{ padding: '1rem' }}>Category</th>
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>MVA</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No entries found. Start by adding a new expense or invoice.
                                </td>
                            </tr>
                        ) : (
                            expenses.map(expense => (
                                <tr key={expense.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>{expense.invoice_date}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{expense.description}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{expense.invoice_number}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '12px', background: 'var(--color-bg-secondary)', fontSize: '0.8rem' }}>
                                            {expense.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            color: expense.type === 'payable' ? 'var(--color-danger)' : 'var(--color-success)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {expense.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{expense.amount}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{expense.mva_amount}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>{expense.total_amount}</td>
                                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        {expense.receipt_url && (
                                            <a
                                                href={expense.receipt_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-icon"
                                                title="View Receipt"
                                                style={{ color: 'var(--color-accent)' }}
                                            >
                                                <Paperclip size={16} />
                                            </a>
                                        )}
                                        <button
                                            className="btn-icon"
                                            onClick={() => deleteExpense(expense.id)}
                                            title="Delete"
                                            style={{ color: 'var(--color-text-muted)', hover: { color: 'var(--color-danger)' } }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Accounting;
