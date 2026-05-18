import java.io.IOError;
import java.io.IOException;
import java.net.*;
import java.util.Scanner;

public class UDPClient {
    public static void main(String[] args) throws IOException {
        DatagramSocket datagramSocket = new DatagramSocket();
        System.out.println("请发送信息给服务器(localhost)");
        InetSocketAddress serverAddress = new InetSocketAddress("127.0.0.1",8000);
        Scanner scanner = new Scanner(System.in);
        while (true){
            System.out.print("请输入信息：");
            String s = scanner.nextLine();
            byte[] data = s.getBytes();
            DatagramPacket packet = new DatagramPacket(data,0,data.length);
            packet.setAddress(serverAddress.getAddress());
            packet.setPort(serverAddress.getPort());
            datagramSocket.send(packet);
        }
    }
}
