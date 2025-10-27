import { IoPeopleOutline, IoColorFillOutline, IoReaderOutline, IoAccessibilityOutline } from "react-icons/io5";
import DashboardCharts from "../components/DashboardCharts";

export default function Dashboard({ isMinimized, staff, products, orders }) {
    return (
        <div>

            <h1 className="pl-10 text-3xl font-bold text-[#7f5539] mb-6">Dashboard</h1>

            {/* Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                <div className="bg-[#f8e7d6] rounded-lg p-4 shadow cursor-pointer">
                <div className="flex justify-between items-center">
                    <div>
                    <div className="text-2xl font-bold">{staff.length}</div>
                    <div className="text-[#7f5539]">Staffs</div>
                    </div>
                    <IoPeopleOutline size={30} className="text-[#7f5539]" />
                </div>
                </div>

                <div className="bg-[#f8e7d6] rounded-lg p-4 shadow cursor-pointer">
                <div className="flex justify-between items-center">
                    <div>
                    <div className="text-2xl font-bold">{products.length}</div>
                    <div className="text-[#7f5539]">Products</div>
                    </div>
                    <IoColorFillOutline size={30} className="text-[#7f5539]" />
                </div>
                </div>

                <div className="bg-[#f8e7d6] rounded-lg p-4 shadow cursor-pointer">
                <div className="flex justify-between items-center">
                    <div>
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <div className="text-[#7f5539]">Orders</div>
                    </div>
                    <IoReaderOutline size={30} className="text-[#7f5539]" />
                </div>
                </div>
            </div>
            {/* Charts */}
            <div className="mt-8 bg-[#f8e7d6] p-6 rounded-lg shadow">
                <DashboardCharts/>
            </div>
        </div>
    );
}
