export default function AddonsItems({name, category, price, onEdit, onDelete}) {
    return(
        <li className="flex justify-between items-center text-center p-2 rounded-lg bg-[#f8e7d6] shadow-md text-[#7f5539] text-lg">
            <h1 className="w-full">{name}</h1>
            <h1 className="w-full">{category}</h1>
            <h1 className="w-full">₱{price.toFixed(2)}</h1>
            <div className="w-full items-center gap-2 flex flex-col">
                <button onClick={onEdit} className="cursor-pointer p-1 border rounded transition-colors bg-blue-100 text-blue-500 hover:text-white hover:bg-blue-500 w-20">edit</button>
                <button onClick={onDelete} className="cursor-pointer p-1 border rounded transition-colors bg-red-100 text-red-500 hover:text-white hover:bg-red-500 w-20">delete</button>
            </div>
        </li>
    )
}